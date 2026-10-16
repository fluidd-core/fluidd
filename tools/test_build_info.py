#!/usr/bin/env python3
"""Tests for provenance embedded by the production build."""

from pathlib import Path
import unittest


ROOT = Path(__file__).parents[1]


class BuildInfoTest(unittest.TestCase):
    def test_plugin_embeds_full_commit_in_json_and_html(self) -> None:
        plugin = (ROOT / "vite.config.inject-version.ts").read_text(encoding="utf-8")
        self.assertIn("FLUIDD_BUILD_COMMIT", plugin)
        self.assertIn("build-info.json", plugin)
        self.assertIn("name: 'fluidd-commit'", plugin)
        self.assertIn("packageVersion", plugin)
        self.assertIn("buildTime", plugin)
        self.assertIn("cloudBaseUrl", plugin)
        self.assertIn("loadEnv", plugin)

    def test_ci_build_refuses_a_dirty_tracked_tree(self) -> None:
        plugin = (ROOT / "vite.config.inject-version.ts").read_text(encoding="utf-8")
        self.assertIn("process.env.CI", plugin)
        self.assertIn("['status', '--porcelain', '--untracked-files=no']", plugin)
        self.assertIn("Refusing to build from a dirty tree in CI", plugin)
        self.assertIn("components.d.ts", plugin)
        self.assertIn(".trimEnd()", plugin)

    def test_vite_manifest_is_opt_in_for_printer_verification(self) -> None:
        config = (ROOT / "vite.config.ts").read_text(encoding="utf-8")
        self.assertIn("process.env.PRINTER_ZIP_VERIFY === '1'", config)
        self.assertNotIn("manifest: true", config)


if __name__ == "__main__":
    unittest.main()
