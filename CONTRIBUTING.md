# Contributing to Fluidd

Fluidd exists as an independent client of Moonraker, and by extension - Klipper.
Fluidd is built on VueJS, using TypeScript.

- Source should always pass the linting rules defined, with no warnings or type errors.
- A clean develop is preferred. This means squashing, and rebasing your feature branches prior to merge.
- PR's should off a branch other than develop or master.
- Commit messages should follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) standard, and should have a Signed-off-by line, for example;

  ```sh
  feat: My feature.

  Some description.

  Signed-off-by: Your Name <your email address>
  ```

- By signing off on commits, you acknowledge that you agree to the [developer certificate of origin](/developer-certificate-of-origin).
This must contain your real name and a current email address.

After cloning the repo and running `npm install`, we recommend running `npm run prepare` to install a couple of git hooks that will pre-validate all commits from that moment.
