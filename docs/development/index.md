---
layout: default
title: Development
nav_order: 8
has_children: true
permalink: /development
---

# Development

Fluidd is built using VueJS, and the Vuetify Framework to provide a cohesive,
easily to implement UI.
{: .fs-6 .fw-300 }

## Running Fluidd locally

### Install Node v16

Follow the instructions from [Node.js](https://nodejs.org) to install Node.js, v16.x.

For example, on Ubuntu flavored Linux distributions,
follow the instructions from [NodeSource](https://github.com/nodesource/distributions/blob/master/README.md#deb)
under "Node.js v16.x":

```bash
# Using Ubuntu
$ curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
$ sudo apt-get install -y nodejs
```

Check that Node.js was installed properly:

```bash
$ node --version
v16.13.2
$ npm --version
8.3.2
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
