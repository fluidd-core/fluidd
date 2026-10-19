#!/usr/bin/env python3
"""Unit tests for verify-printer-zip.py, using deliberately tiny archives."""

import hashlib
import base64
import json
from pathlib import Path
import stat
import subprocess
import tempfile
import unittest
import zipfile
import zlib


ROOT = Path(__file__).parents[1]
VERIFY = ROOT / "tools/verify-printer-zip.py"
COMMIT = "a" * 40
CONTROL = "https://control.muon3d.com"


class VerifyPrinterZipTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.zip_path = Path(self.temp.name) / "fluidd.zip"

    def tearDown(self) -> None:
        self.temp.cleanup()

    def files(self) -> dict[str, str]:
        config = json.loads((ROOT / "public/config.json").read_text(encoding="utf-8"))
        return {
            "index.html": '<meta name="fluidd-commit" content="' + COMMIT + '"><script src="/assets/app.js"></script>',
            "assets/app.js": 'import("./lazy.js")',
            "assets/lazy.js": "export default 1",
            ".vite/manifest.json": json.dumps({
                "index.html": {"file": "assets/app.js", "isEntry": True, "dynamicImports": ["src/lazy.ts"]},
                "src/lazy.ts": {"file": "assets/lazy.js"},
            }),
            "build-info.json": json.dumps({"commit": COMMIT, "buildTime": "2026-10-16T00:00:00.000Z", "packageVersion": "1.2.3", "cloudBaseUrl": CONTROL}),
            "config.json": json.dumps(config),
        }

    def write_zip(self, files: dict[str, str] | None = None, special: zipfile.ZipInfo | None = None) -> None:
        with zipfile.ZipFile(self.zip_path, "w") as archive:
            archive_files = (files or self.files()).copy()
            manifest = archive_files.pop(".vite/manifest.json", None)
            for name, contents in archive_files.items():
                archive.writestr(name, contents)
            if special:
                archive.writestr(special, "target")
            if manifest is not None:
                archive.comment = b"fluidd-vite-manifest-v1:" + base64.b64encode(zlib.compress(manifest.encode()))

    def run_verify(self, *, sha: str | None = None, commit: str = COMMIT, size: int | None = None) -> subprocess.CompletedProcess[str]:
        digest = sha or hashlib.sha256(self.zip_path.read_bytes()).hexdigest()
        expected_size = self.zip_path.stat().st_size if size is None else size
        return subprocess.run(
            ["python3", str(VERIFY), str(self.zip_path), digest, commit, "--expected-size", str(expected_size)],
            cwd=ROOT, text=True, capture_output=True, check=False,
        )

    def assert_bad(self, reason: str, **kwargs: object) -> None:
        result = self.run_verify(**kwargs)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(reason, result.stderr)

    def test_accepts_valid_printer_zip(self) -> None:
        self.write_zip()
        result = self.run_verify()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("verified", result.stdout)
        self.assertIn("does not independently prove", result.stdout)
        self.assertIn("reported by the build itself", result.stdout)
        self.assertIn("config.json is checked only for hosted:false", result.stdout)

    def test_rejects_zip_that_predates_build_info(self) -> None:
        files = self.files()
        del files["build-info.json"]
        self.write_zip(files)
        self.assert_bad("zip predates build-info.json and cannot be verified")

    def test_rejects_empty_or_ambiguous_entry_manifest(self) -> None:
        for manifest in ({}, {
            "index.html": {"file": "assets/app.js", "isEntry": True},
            "other.html": {"file": "assets/lazy.js", "isEntry": True},
        }, {"index.html": {"file": "assets/app.js"}}):
            files = self.files()
            files[".vite/manifest.json"] = json.dumps(manifest)
            self.write_zip(files)
            self.assert_bad("exactly one isEntry entry for index.html")

    def test_rejects_missing_worker_referenced_by_a_chunk(self) -> None:
        files = self.files()
        files["assets/app.js"] += ';new Worker(new URL("./gcode.worker-deadbeef.js",import.meta.url))'
        self.write_zip(files)
        self.assert_bad("referenced asset is missing: assets/gcode.worker-deadbeef.js")

    def monaco_files(self) -> dict[str, str]:
        # vite-plugin-monaco-editor 1.1.0: transformIndexHtml injects the worker
        # paths as JSON into index.html; writeBundle writes the files under
        # <base>monacoeditorwork/ (languageWorkers: editorWorkerService, json, css).
        paths = {
            "editorWorkerService": "/monacoeditorwork/editor.worker.bundle.js",
            "css": "/monacoeditorwork/css.worker.bundle.js",
            "json": "/monacoeditorwork/json.worker.bundle.js",
            "less": "/monacoeditorwork/css.worker.bundle.js",
            "scss": "/monacoeditorwork/css.worker.bundle.js",
        }
        files = self.files()
        files["index.html"] = (
            '<script>self["MonacoEnvironment"] = (function (paths) { return {}; })('
            + json.dumps(paths, indent=2) + ');</script>' + files["index.html"]
        )
        for name in ("editor", "css", "json"):
            files[f"monacoeditorwork/{name}.worker.bundle.js"] = "self.onmessage=()=>{}"
        return files

    def test_rejects_missing_monaco_editor_worker(self) -> None:
        files = self.monaco_files()
        del files["monacoeditorwork/json.worker.bundle.js"]
        self.write_zip(files)
        self.assert_bad("referenced asset is missing: monacoeditorwork/json.worker.bundle.js")

    def test_reports_monaco_workers_checked_or_unchecked(self) -> None:
        self.write_zip(self.monaco_files())
        result = self.run_verify()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Monaco editor workers under monacoeditorwork/ referenced from index.html", result.stdout)
        self.write_zip()
        result = self.run_verify()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Monaco editor workers (unchecked: no monacoeditorwork/ URL in index.html)", result.stdout)
        self.assertIn("worker bundles (unchecked: no URL discoverable)", result.stdout)

    def test_rejects_missing_workbox_precache_asset(self) -> None:
        files = self.files()
        files["sw.js"] = 'self.__WB_MANIFEST=[{url:"assets/precache-deadbeef.js",revision:null}]'
        self.write_zip(files)
        self.assert_bad("referenced asset is missing: assets/precache-deadbeef.js")

    def test_rejects_wrong_hash_and_size(self) -> None:
        self.write_zip()
        self.assert_bad("SHA256", sha="0" * 64)
        self.assert_bad("size", size=1)

    def test_rejects_absolute_parent_and_symlink_paths(self) -> None:
        for bad_name, reason in (("/evil", "absolute"), ("../evil", "parent traversal")):
            self.write_zip({**self.files(), bad_name: "bad"})
            self.assert_bad(reason)
        link = zipfile.ZipInfo("link")
        link.create_system = 3
        link.external_attr = (stat.S_IFLNK | 0o777) << 16
        self.write_zip(special=link)
        self.assert_bad("symlink")

    def test_rejects_missing_index_or_referenced_asset(self) -> None:
        files = self.files()
        del files["index.html"]
        self.write_zip(files)
        self.assert_bad("index.html")
        files = self.files()
        del files["assets/app.js"]
        self.write_zip(files)
        self.assert_bad("referenced asset")

    def test_rejects_commit_mismatch_in_json_or_meta(self) -> None:
        files = self.files()
        files["build-info.json"] = files["build-info.json"].replace(COMMIT, "b" * 40)
        self.write_zip(files)
        self.assert_bad("build-info.json commit")
        files = self.files()
        files["index.html"] = files["index.html"].replace(COMMIT, "b" * 40)
        self.write_zip(files)
        self.assert_bad("fluidd-commit meta")

    def test_rejects_hosted_config(self) -> None:
        files = self.files()
        files["config.json"] = (ROOT / "server/config.json").read_text(encoding="utf-8")
        self.write_zip(files)
        self.assert_bad("printer config")

    def test_rejects_wrong_or_missing_configured_cloud_url(self) -> None:
        files = self.files()
        info = json.loads(files["build-info.json"])
        info["cloudBaseUrl"] = "https://app.muon3d.com"
        files["build-info.json"] = json.dumps(info)
        self.write_zip(files)
        self.assert_bad(CONTROL)
        files = self.files()
        info = json.loads(files["build-info.json"])
        del info["cloudBaseUrl"]
        files["build-info.json"] = json.dumps(info)
        self.write_zip(files)
        self.assert_bad(CONTROL)

    def test_rejects_missing_manifest_asset_including_lazy_chunks(self) -> None:
        files = self.files()
        del files["assets/lazy.js"]
        self.write_zip(files)
        self.assert_bad("manifest referenced asset")

    def test_runs_on_python_38_type_annotation_rules(self) -> None:
        source = VERIFY.read_text(encoding="utf-8")
        self.assertIn("from __future__ import annotations", source)

    def test_rejects_source_maps_and_env_files(self) -> None:
        for name, reason in (("assets/app.js.map", "source map"), (".env.production", ".env")):
            self.write_zip({**self.files(), name: "secret-ish"})
            self.assert_bad(reason)


if __name__ == "__main__":
    unittest.main()
