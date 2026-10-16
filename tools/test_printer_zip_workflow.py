#!/usr/bin/env python3
"""Policy checks for the immutable MuonOS printer release workflow."""

from pathlib import Path
import re
import unittest


WORKFLOW = Path(__file__).parents[1] / ".github/workflows/printer-zip.yaml"


class PrinterZipWorkflowTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.workflow = WORKFLOW.read_text(encoding="utf-8")

    def test_is_manual_and_requires_a_full_develop_sha(self) -> None:
        self.assertRegex(self.workflow, r"(?m)^  workflow_dispatch:\s*$")
        self.assertRegex(self.workflow, r"(?ms)^      develop_sha:.*?required: true")
        self.assertIn("^[0-9a-f]{40}$", self.workflow)
        self.assertIn("git merge-base --is-ancestor", self.workflow)
        self.assertIn("origin/develop", self.workflow)
        self.assertIn("git checkout --detach", self.workflow)

    def test_build_uses_repository_checks_and_production_packaging(self) -> None:
        for command in (
            "npm ci",
            "npm run lint -- --no-fix",
            "npm run type-check",
            "npm run test:unit",
            "npm run circular-check",
            "npm run build",
            "npm run check:setup-budget",
            "zip -r ../fluidd.zip .",
        ):
            self.assertIn(command, self.workflow)

    def test_release_is_new_immutable_and_verified(self) -> None:
        self.assertIn("muonos-${SHA::7}", self.workflow)
        self.assertIn("gh release view", self.workflow)
        self.assertIn("git ls-remote --exit-code --tags", self.workflow)
        self.assertIn("gh release create", self.workflow)
        self.assertIn("--prerelease", self.workflow)
        self.assertIn("--target \"$SHA\"", self.workflow)
        self.assertIn("fluidd.zip.sha256", self.workflow)
        self.assertIn("gh release download", self.workflow)
        self.assertIn("sha256sum --check", self.workflow)
        self.assertIn("stat --format='%s'", self.workflow)
        self.assertNotIn("--clobber", self.workflow)
        self.assertNotRegex(self.workflow, r"\b(gh release delete|git push .*--delete)\b")

    def test_has_only_the_narrow_publish_surface(self) -> None:
        self.assertIn("runs-on: ${{ vars.LINUX_RUNS_ON }}", self.workflow)
        self.assertRegex(self.workflow, r"(?ms)^permissions:\s*\n  contents: write\s*$")
        self.assertNotIn("actions/upload-artifact", self.workflow)
        self.assertNotIn("docker", self.workflow.lower())
        self.assertNotIn("FLUIDD_PAUSE_PUBLISH", self.workflow)


if __name__ == "__main__":
    unittest.main()
