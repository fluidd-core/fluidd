#!/usr/bin/env python3
"""Integration tests for check-printer-fluidd.py."""
from __future__ import annotations

from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
import zipfile


ROOT = Path(__file__).parents[1]
CHECKER = ROOT / "tools/check-printer-fluidd.py"
COMMIT = "0123456789abcdef0123456789abcdef01234567"


class FixtureHandler(SimpleHTTPRequestHandler):
    redirect_path: str | None = None
    root_contents: bytes | None = None

    def log_message(self, _format: str, *_args: object) -> None:
        pass

    def do_GET(self) -> None:
        if self.headers.get("Cookie") or self.headers.get("Authorization"):
            self.send_error(400, "credentials sent")
            return
        if self.redirect_path is not None and self.path.lstrip("/") == self.redirect_path:
            self.send_response(302)
            self.send_header("Location", "/redirect-target.html")
            self.end_headers()
            return
        if self.path == "/" and self.root_contents is not None:
            self.send_response(200)
            self.send_header("Content-Length", str(len(self.root_contents)))
            self.end_headers()
            self.wfile.write(self.root_contents)
            return
        super().do_GET()


class PrinterCheckTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.web = self.root / "web"
        self.web.mkdir()
        self.files = {
            "index.html": b"<script src='/assets/app.js'></script>",
            "assets/app.js": b"console.log('printer');",
            "build-info.json": json.dumps({"commit": COMMIT, "cloudBaseUrl": "https://control.muon3d.com"}).encode(),
            "config.json": b'{"hosted":false}',
            "sw.js": b'const VERSION = "fixture-v1";',
        }
        for name, contents in self.files.items():
            path = self.web / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(contents)
        (self.web / "redirect-target.html").write_bytes(self.files["index.html"])
        self.archive = self.root / "fluidd.zip"
        with zipfile.ZipFile(self.archive, "w") as archive:
            for name, contents in self.files.items():
                archive.writestr(name, contents)

    def tearDown(self) -> None:
        self.temp.cleanup()

    @contextmanager
    def server(self, redirect_path: str | None = None, root_contents: bytes | None = None):
        handler = lambda *args, **kwargs: FixtureHandler(*args, directory=str(self.web), **kwargs)
        FixtureHandler.redirect_path = redirect_path
        FixtureHandler.root_contents = root_contents
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{server.server_port}"
        finally:
            server.shutdown()
            thread.join()
            server.server_close()

    def run_check(self, base_url: str, env: dict[str, str] | None = None) -> tuple[subprocess.CompletedProcess[str], dict]:
        report = self.root / "report.json"
        result = subprocess.run(
            ["python3", str(CHECKER), base_url, "--zip", str(self.archive), "--out", str(report), "--timeout", "1", "--retries", "1"],
            text=True, capture_output=True, check=False, env=env,
        )
        return result, json.loads(report.read_text()) if report.exists() else {}

    def test_exact_match(self) -> None:
        with self.server() as url:
            result, report = self.run_check(url)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertTrue(report["exactMatch"])
        self.assertEqual(COMMIT, report["served"]["commit"])
        self.assertEqual("https://control.muon3d.com", report["served"]["cloudBaseUrl"])
        self.assertEqual("fixture-v1", report["serviceWorker"]["version"])
        self.assertEqual(len(self.archive.read_bytes()), report["zipSize"])
        self.assertEqual(hashlib.sha256(self.archive.read_bytes()).hexdigest(), report["zipSha256"])
        self.assertEqual("match", report["root"]["status"])

    def test_trailing_slash_is_accepted(self) -> None:
        with self.server() as url:
            result, report = self.run_check(url + "/")
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertTrue(report["exactMatch"])

    def test_proxy_environment_is_ignored(self) -> None:
        env = os.environ.copy()
        env.update({"http_proxy": "http://127.0.0.1:1", "HTTP_PROXY": "http://127.0.0.1:1"})
        env.pop("no_proxy", None)
        env.pop("NO_PROXY", None)
        with self.server() as url:
            result, report = self.run_check(url, env)
        self.assertEqual(0, result.returncode, result.stderr)
        self.assertTrue(report["exactMatch"])

    def test_root_must_match_index(self) -> None:
        with self.server(root_contents=b"not the archive index") as url:
            result, report = self.run_check(url)
        self.assertNotEqual(0, result.returncode)
        self.assertEqual("mismatch", report["root"]["status"])

    def test_changed_byte(self) -> None:
        (self.web / "assets/app.js").write_bytes(b"console.log('changed');")
        with self.server() as url:
            result, report = self.run_check(url)
        self.assertNotEqual(0, result.returncode)
        self.assertEqual("mismatch", report["files"]["assets/app.js"]["status"])

    def test_missing_file(self) -> None:
        (self.web / "assets/app.js").unlink()
        with self.server() as url:
            result, report = self.run_check(url)
        self.assertNotEqual(0, result.returncode)
        self.assertEqual("missing", report["files"]["assets/app.js"]["status"])

    def test_redirect_is_not_followed(self) -> None:
        with self.server("index.html") as url:
            result, report = self.run_check(url)
        self.assertNotEqual(0, result.returncode)
        self.assertEqual("redirect", report["files"]["index.html"]["status"])

    def test_hosted_config_fails(self) -> None:
        (self.web / "config.json").write_bytes(b'{"hosted":true}')
        with self.server() as url:
            result, report = self.run_check(url)
        self.assertNotEqual(0, result.returncode)
        self.assertIs(report["served"]["hosted"], True)
        self.assertIn("config.json must contain hosted:false", report["errors"])

    def test_rejects_paths_queries_and_credentials(self) -> None:
        cases = (
            ("http://127.0.0.1:1/path", "BASE_URL must not contain a path, query, or fragment"),
            ("http://127.0.0.1:1?x=1", "BASE_URL must not contain a path, query, or fragment"),
            ("http://user:pass@127.0.0.1:1", "BASE_URL must have a host and must not contain credentials"),
        )
        for url, expected_error in cases:
            with self.subTest(url=url):
                result, report = self.run_check(url)
                self.assertNotEqual(0, result.returncode)
                self.assertFalse(report["exactMatch"])
                self.assertEqual([expected_error], report["errors"])


if __name__ == "__main__":
    unittest.main()
