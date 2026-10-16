#!/usr/bin/env python3
"""Unit tests for verify-printer-zip.py, using deliberately tiny archives."""

import hashlib
import json
from pathlib import Path
import stat
import subprocess
import tempfile
import unittest
import zipfile


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
            "assets/app.js": f'const cloud="{CONTROL}";const accepted=["{CONTROL}","https://app.muon3d.com"]',
            "build-info.json": json.dumps({"commit": COMMIT, "buildTime": "2026-10-16T00:00:00.000Z", "packageVersion": "1.2.3"}),
            "config.json": json.dumps(config),
        }

    def write_zip(self, files: dict[str, str] | None = None, special: zipfile.ZipInfo | None = None) -> None:
        with zipfile.ZipFile(self.zip_path, "w") as archive:
            for name, contents in (files or self.files()).items():
                archive.writestr(name, contents)
            if special:
                archive.writestr(special, "target")

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

    def test_rejects_wrong_cloud_url_or_unpaired_legacy_host(self) -> None:
        files = self.files()
        files["assets/app.js"] = 'const cloud="https://example.com"'
        self.write_zip(files)
        self.assert_bad(CONTROL)
        files = self.files()
        files["assets/app.js"] += ';const legacy="https://app.muon3d.com"'
        files["assets/only-old.js"] = 'const legacy="https://app.muon3d.com"'
        self.write_zip(files)
        self.assert_bad("without the canonical control host")

    def test_rejects_source_maps_and_env_files(self) -> None:
        for name, reason in (("assets/app.js.map", "source map"), (".env.production", ".env")):
            self.write_zip({**self.files(), name: "secret-ish"})
            self.assert_bad(reason)


if __name__ == "__main__":
    unittest.main()
