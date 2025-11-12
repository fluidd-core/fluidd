---
layout: default
title: Manual Installation
parent: Installation
nav_order: 3
permalink: /installation/manual
---

# Manual Installation
{: .no_toc }

---

Fluidd comes with a `build` script which automatically transpiles and bundles the source code.
Every Fluidd release has a pre-built package available in the [GitHub Releases](https://github.com/fluidd-core/fluidd/releases) (`fluidd.zip`).

To manually build Fluidd, make sure you have NodeJS (v24.x) and Git installed. You can follow these steps to build the Fluidd repository:
1. Clone the [Fluidd source code](https://github.com/fluidd-core/fluidd): `git clone https://github.com/fluidd-core/fluidd.git`
2. Navigate to the Fluidd source code directory: `cd fluidd`
3. Install the dependencies: `npm ci`
4. Build and bundle Fluidd: `npm run build`

The built files will be written to the `dist` directory.
You can serve these with your preferred HTTP server, for example [NGINX](https://www.nginx.com/).

Please note that building on a Raspberry Pi isn't supported as of now (due to hardware limitations).
If you'd like to serve your Fluidd installation from a Raspberry Pi, please build it on a PC and copy the `dist` directory over using [scp](https://linux.die.net/man/1/scp) (or a method of your choice). Alternatively, you may want to consider one of our alternative installation methods:
* [KIAUH](/installation/kiauh)
* [FluiddPi](/installation/fluiddpi)

To build Fluidd for development purposes, run `npm run serve` instead of `npm run build` to enable hot-reloads.
