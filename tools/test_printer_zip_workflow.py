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
        self.assertIn("PRINTER_ZIP_VERIFY: '1'", self.workflow)
        self.assertIn("test -s dist/.vite/manifest.json", self.workflow)
        self.assertIn("rm -rf dist/.vite", self.workflow)
        self.assertIn('python3 "$RUNNER_TEMP/embed-printer-manifest.py"', self.workflow)

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
        self.assertIn("FLUIDD_BUILD_COMMIT: ${{ inputs.develop_sha }}", self.workflow)
        self.assertIn("tools/verify-printer-zip.py", self.workflow)
        self.assertRegex(
            self.workflow,
            r'\$RUNNER_TEMP/verify-printer-zip\.py"\s+release-download/fluidd\.zip\s+\\\s+"\$BUILT_SHA256"\s+"\$SHA"\s+--expected-size\s+"\$BUILT_SIZE"',
        )
        local_verify = self.workflow.index("Verify local printer zip")
        release = self.workflow.index("Create new prerelease")
        remote_verify = self.workflow.index("Verify downloaded printer zip")
        self.assertLess(local_verify, release)
        self.assertGreater(remote_verify, release)
        self.assertIn('cp tools/verify-printer-zip.py "$RUNNER_TEMP/verify-printer-zip.py"', self.workflow)
        self.assertEqual(2, self.workflow.count('python3 "$RUNNER_TEMP/verify-printer-zip.py"'))
        self.assertNotIn("--clobber", self.workflow)
        self.assertNotRegex(self.workflow, r"\b(gh release delete|git push .*--delete)\b")

    def test_has_only_the_narrow_publish_surface(self) -> None:
        self.assertIn("runs-on: ${{ vars.LINUX_RUNS_ON }}", self.workflow)
        self.assertRegex(self.workflow, r"(?ms)^permissions:\s*\n  contents: write\s*$")
        self.assertNotIn("actions/upload-artifact", self.workflow)
        self.assertNotIn("docker", self.workflow.lower())
        self.assertNotIn("FLUIDD_PAUSE_PUBLISH", self.workflow)

    def test_write_token_is_available_only_to_gh_steps(self) -> None:
        workflow_preamble, jobs = self.workflow.split("\njobs:\n", maxsplit=1)
        job_preamble, steps = jobs.split("\n    steps:\n", maxsplit=1)
        for env_scope in (workflow_preamble, job_preamble):
            self.assertNotRegex(env_scope, r"(?m)^\s+GH_TOKEN:")
            self.assertNotIn("github.token", env_scope)

        step_blocks = re.split(r"(?m)(?=^      - name: )", steps)
        named_steps = [step for step in step_blocks if step.startswith("      - name: ")]
        checkout_step = next(
            step for step in named_steps if "uses: actions/checkout@v4" in step
        )
        self.assertIn("persist-credentials: false", checkout_step)
        gh_steps = [step for step in named_steps if re.search(r"\bgh release ", step)]
        self.assertEqual(3, len(gh_steps))
        for step in named_steps:
            has_token = "GH_TOKEN: ${{ github.token }}" in step
            self.assertEqual(step in gh_steps, has_token)

        verifier_steps = [step for step in named_steps if 'python3 "$RUNNER_TEMP/verify-printer-zip.py"' in step]
        self.assertEqual(2, len(verifier_steps))
        self.assertTrue(all("GH_TOKEN" not in step for step in verifier_steps))

    def test_clean_ci_checkout_is_built_twice(self) -> None:
        self.assertEqual(2, self.workflow.count("CI=1 npm run build"))

    def test_release_notes_workflow_run_has_no_indentation(self) -> None:
        self.assertIn('printf -v RELEASE_NOTES', self.workflow)
        self.assertIn('--notes "$RELEASE_NOTES"', self.workflow)


if __name__ == "__main__":
    unittest.main()
