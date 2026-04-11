---
title: Development
icon: lucide/wrench
---

# Development

Fluidd is built using VueJS, and the Vuetify Framework to provide a cohesive,
easy to implement UI.

## Contributing

Contributions are welcome! Please review the
[CONTRIBUTING.md](https://github.com/fluidd-core/fluidd/blob/develop/CONTRIBUTING.md)
file before submitting a pull request.

## Dev Container in Visual Studio Code

Fluidd includes a Dev Container configuration to easily open with Visual Studio Code
(VSCode) and have every tool and dependency installed.

### Install Visual Studio Code

Follow the instruction from [Visual Studio Code](https://code.visualstudio.com/) to
install.

Make sure to also install the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
extension so that VSCode knows how to use the Dev Container configuration.

### Install Docker

Follow the instruction from [Docker](https://docs.docker.com/engine/install/) to install.

### Open the Dev Container

At this point all you need to do is open Fluidd folder in VSCode and you should see a
popup indicating that it found a Dev Container configuration file; click the "Reopen in
Container" to have everything configured.

The configuration includes a container running [docker-klipper-simulavr](https://github.com/pedrolamas/docker-klipper-simulavr),
a virtualized Klipper and Moonraker image that makes it easy to debug without a real
printer.

## Running Fluidd locally

### Install Node.js

Follow the instructions from [Node.js](https://nodejs.org) to install Node.js, v24.x.

Check that Node.js was installed properly:

```bash
node --version
npm --version
```

### Install dependencies

```bash
cd .../path/to/fluidd
npm ci
```

### Run a local development server

```bash
npm run dev
```

Browse to [http://localhost:8080/](http://localhost:8080/) and type in the URL
of your Moonraker instance, e.g. `http://192.168.0.101:7125`.

### Run unit tests

```bash
npm run test
```

## Running the documentation site locally

### Install Python

Follow the instructions from [Python](https://www.python.org/) to install Python 3.

### Install dependencies

```bash
cd .../path/to/fluidd/docs
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Serve locally

```bash
zensical serve
```

Browse to [http://localhost:8000/](http://localhost:8000/).

### Build static site

```bash
zensical build --clean
```

## Localization

Fluidd uses [vue-i18n](https://kazupon.github.io/vue-i18n/) for its localization.

Locales can be found in the `src/locales` folder and are in YAML format.

### How to contribute

Translations are hosted on Weblate. If you want to help translating our project, please click the widget below:

[![Translation status](https://hosted.weblate.org/widget/fluidd/horizontal-auto.svg)](https://hosted.weblate.org/engage/fluidd/ "Translation status")

### Tooling

#### VSCode and i18n Ally

If you prefer, you can use VSCode and the [i18n Ally](https://marketplace.visualstudio.com/items?itemName=antfu.i18n-ally) extension to help translating offline.

If you're setup with VSCode, then this extension comes highly recommended.

Once you have a translation in hand, you can either PR the code changes directly or create an issue with the translations attached.
