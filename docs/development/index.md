---
layout: default
title: Development
nav_order: 8
has_children: true
permalink: /development
---

# Development

Fluidd is built using VueJS, and the Vuetify Framework to provide a cohesive,
easy to implement UI.
{: .fs-6 .fw-300 }

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

### Install Node v24

Follow the instructions from [Node.js](https://nodejs.org) to install Node.js, v24.x.

Check that Node.js was installed properly:

```bash
$ node --version
v24.11.0
$ npm --version
11.6.2
```

### Install dependencies

```bash
$ cd .../path/to/fluidd
$ npm install
```

### Run a local development server

```bash
$ npm run-script serve
```

Browse to [http://localhost:8080/](http://localhost:8080/) and type in the URL
of your Moonraker instance, e.g. `http://192.168.0.101:7125`.

### Run unit tests

```bash
$ npm run test:unit
```
