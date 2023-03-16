---
layout: default
title: FluiddPI (not recommended)
parent: Installation
nav_order: 4
permalink: /installation/fluiddpi
---

# FluiddPI
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## ⚠️ WARNING ⚠️
{: .text-red-300 #warning}

FluiddPI is not under active maintenance and we've had reports from users
finding issues while using it.

As such, our recommendation is that you **do not use FluiddPI**, and instead
use [KIAUH](/installation/kiauh) to install Fluidd.

---

## Overview

FluiddPI is a Raspberry Pi OS Lite image, preconfigured with Klipper, Moonraker and
Fluidd.

[View on GitHub](https://github.com/fluidd-core/FluiddPi){: .btn .fs-5 .mb-4 .mb-md-0 }

## Download

Start by downloading the latest release of [FluiddPI](https://github.com/fluidd-core/FluiddPi/releases/latest).

## Flash

Flashing your SDCard is the same process as any other Raspbian image.

1. Quality of SDCard matters. Recommend using known, reputable brands such as
Sandisk, Samsung and Kingston.
2. The flashing process will WIPE YOUR SDCARD. Be sure you have no existing data
you'd like to keep from it.

For windows users, the recommended tool for flashing is [Balena Etcher](https://www.balena.io/etcher/).

For Linux or macOs users, the recommended tool for flashing is [Raspberry Pi Imager](https://www.raspberrypi.org/software/).

## Configure

1. Configure the WiFI connection by editing `fluiddpi-wpa-supplicant.txt` on the
root of the flashed card when using it like a thumb drive.
*Important:* Do not use WordPad (Windows) or TextEdit (MacOS X) for this, those
editors are known to mangle the file, making configuration fail.
Use something like Notepad++, Atom or VSCode instead or at the very least heed
the warnings in the file.
   a. *Note:* Often, connectivity issues can be boiled down to WiFi issues. If
      you're having trouble, try plugging in an ethernet cable.
2. Boot the Pi from the card.
3. Log into your Pi via SSH (it should be located at `fluiddpi.local`)
   if your computer supports Bonjour. If not, you may need to access via it's IP
   address.
   - If your computer supports Bonjour, it should be located at
     `fluiddpi.local`.
   - For networks that correctly manage DNS, your host maybe located at
     `fluiddpi`.
   - If you can't find your Pi, try inspecting your Router web UI.
4. Configure your host.
   - The default username and password is `pi` and `raspberry`.
   - Run the raspi-config tool;
     ```sudo raspi-config```
   - Change your Password via `System Options -> Password`.
   - Change your Timezone via `Localization Options -> Timezone`.
   - Change your Locale via `Localization Options -> Locale`.
   - Optionally change your hostname via `System Options -> Hostname`. Your
     hostname should be a single word. Fluidd will no longer be available at
     `fluiddpi.local` but rather `yourhostname.local`.
4. *You should not need to expand the filesystem.*
   *You should not need to manually enable the RaspiCam. This is done for you.*
5. You should now be able to access Fluidd through `http://fluiddpi.local` or
   `http://yourhostname.local`.
