---
title: Installation
---

# Installation

The recommended way to install Fluidd is to use KIAUH.

## KIAUH

KIAUH (Klipper Installation And Update Helper) makes installation and updates a breeze, no matter if it is just a simple
install or when you'd like to trial more than one user interface on your device,
or have more of an advanced setup.

For more information on KIAUH, please visit its github page.

[View on GitHub](https://github.com/dw-0/kiauh){.md-button}

## Docker

Fluidd can be hosted with Docker. This is considered an advanced install, but
gives you the benefit of hosting a single instance of Fluidd, and having it
connect to multiple printers.

We have an [official docker image](https://github.com/fluidd-core/fluidd/pkgs/container/fluidd),
serving Fluidd by default on port 80.

For those who have specific security requirements and need/want to run an
unprivileged container, we also have an [unprivileged docker image](https://github.com/fluidd-core/fluidd/pkgs/container/fluidd-unprivileged)
available, serving Fluidd by default on port 8080.

Both of these docker images are updated for each release and on each commit.

This is a list of the available docker image tags:

- `latest`: points to the most recent release
- `v*.*.*`: points to a specific release
- `latest-master`: points to the most recent commit to the "master" branch
- `latest-develop`: points to the most recent commit to the "develop" branch
- `sha-<hash>`: points to a specific git commit hash

[View on GitHub Container registry](https://github.com/fluidd-core/fluidd/pkgs/container/fluidd){.md-button}

## Manual Installation

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
If you'd like to serve your Fluidd installation from a Raspberry Pi, please build it on a PC and copy the `dist` directory over using [scp](https://linux.die.net/man/1/scp) (or a method of your choice).

To build Fluidd for development purposes, run `npm run dev` instead of `npm run build` to enable hot-reloads.

## fluidd.xyz

Have Mainsail installed, or don't want to install Fluidd locally? We support that!

Fluidd is also hosted at `http://app.fluidd.xyz`. When used in this way,
Fluidd is downloaded to your browser.

It has no interaction outside of your network unless configured to do so, and
essentially works in the same way as hosting Fluidd yourself.

In order for Fluidd to connect to your printer, you'll need to configure
Moonraker.

In the `moonraker.conf` file is a section called `cors_domains:`.
The fluidd.xyz host must be in this section for a successful connection to be
made.

Generally, you can find the moonraker.conf file here:
`~/printer_data/config/moonraker.conf`.

Alternatively, you can edit the file via the file browser in Fluidd.

A suitable example can be found in the [Moonraker example configuration](/configuration#example-configuration).

## FluiddPI

### ⚠️ WARNING ⚠️

FluiddPI is not under active maintenance and we've had reports from users
finding issues while using it.

As such, our recommendation is that you **do not use FluiddPI**, and instead
use [KIAUH](#kiauh) to install Fluidd.

---

FluiddPI is a Raspberry Pi OS Lite image, preconfigured with Klipper, Moonraker and
Fluidd.

[View on GitHub](https://github.com/fluidd-core/FluiddPi){.md-button}

### Download

Start by downloading the latest release of [FluiddPI](https://github.com/fluidd-core/FluiddPi/releases/latest).

### Flash

Flashing your SDCard is the same process as any other Raspbian image.

1. Quality of SDCard matters. Recommend using known, reputable brands such as
Sandisk, Samsung and Kingston.
2. The flashing process will WIPE YOUR SDCARD. Be sure you have no existing data
you'd like to keep from it.

For windows users, the recommended tool for flashing is [Balena Etcher](https://www.balena.io/etcher/).

For Linux or macOs users, the recommended tool for flashing is [Raspberry Pi Imager](https://www.raspberrypi.org/software/).

### Configure

1. Configure the WiFI connection by editing `fluiddpi-wpa-supplicant.txt` on the
root of the flashed card when using it like a thumb drive.
*Important:* Do not use WordPad (Windows) or TextEdit (MacOS X) for this, those
editors are known to mangle the file, making configuration fail.
Use something like Notepad++, Atom or VSCode instead or at the very least heed
the warnings in the file.
   - *Note:* Often, connectivity issues can be boiled down to WiFi issues. If
     you're having trouble, try plugging in an ethernet cable.
2. Boot the Pi from the card.
3. Log into your Pi via SSH (it should be located at `fluiddpi.local`)
   if your computer supports Bonjour. If not, you may need to access via it's IP
   address.
   - If your computer supports Bonjour, it should be located at `fluiddpi.local`.
   - For networks that correctly manage DNS, your host maybe located at `fluiddpi`.
   - If you can't find your Pi, try inspecting your Router web UI.
4. Configure your host.
   - The default username and password is `pi` and `raspberry`.
   - Run the raspi-config tool: `sudo raspi-config`
   - Change your Password via `System Options -> Password`.
   - Change your Timezone via `Localization Options -> Timezone`.
   - Change your Locale via `Localization Options -> Locale`.
   - Optionally change your hostname via `System Options -> Hostname`. Your
     hostname should be a single word. Fluidd will no longer be available at
     `fluiddpi.local` but rather `yourhostname.local`.
5. *You should not need to expand the filesystem.*
   *You should not need to manually enable the RaspiCam. This is done for you.*
6. You should now be able to access Fluidd through `http://fluiddpi.local` or
   `http://yourhostname.local`.
