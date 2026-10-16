#!/usr/bin/env python3
"""Integration tests for check-printer-fluidd.py."""
from __future__ import annotations

from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
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
    redirect_path = ""

    def log_message(self, _format: str, *_args: object) -> None:
        pass

    def do_GET(self) -> None:
        if self.headers.get("Cookie") or self.headers.get("Authorization"):
            self.send_error(400, "credentials sent")
            return
        if self.path.lstrip("/") == self.redirect_path:
            self.send_response(302)
            self.send_header("Location", "/index.html")
            self.end_headers()
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
        self.archive = self.root / "fluidd.zip"
        with zipfile.ZipFile(self.archive, "w") as archive:
            for name, contents in self.files.items():
                archive.writestr(name, contents)

    def tearDown(self) -> None:
        self.temp.cleanup()

    @contextmanager
    def server(self, redirect_path: str = ""):
        handler = lambda *args, **kwargs: FixtureHandler(*args, directory=str(self.web), **kwargs)
        FixtureHandler.redirect_path = redirect_path
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f"http://127.0.0.1:{server.server_port}"
        finally:
            server.shutdown()
            thread.join()
            server.server_close()

    def run_check(self, base_url: str) -> tuple[subprocess.CompletedProcess[str], dict]:
        report = self.root / "report.json"
        result = subprocess.run(
            ["python3", str(CHECKER), base_url, "--zip", str(self.archive), "--out", str(report), "--timeout", "1", "--retries", "1"],
            text=True, capture_output=True, check=False,
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
        for url in ("http://printer.local/path", "http://printer.local?x=1", "http://user:pass@printer.local"):
            with self.subTest(url=url):
                result, report = self.run_check(url)
                self.assertNotEqual(0, result.returncode)
                self.assertFalse(report["exactMatch"])


if __name__ == "__main__":
    unittest.main()
