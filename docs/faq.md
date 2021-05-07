---
layout: default
title: FAQ
nav_order: 8
permalink: /faq
---

# FAQ
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## I'd like to setup multiple cameras, how?

- FluiddPI works very similarly to OctoPrint. Take a look at the following link
  for some hints, or try a google search.
  https://www.makersmashup.com/post/outside-the-box-multiple-webcam-setup-with-octoprint

## I have an INVALID status for Fluidd, Moonraker or Klipper on the Update panel

- Updates can sometimes fail and cause this error. Your first option is to try
  Fluidd now provides a recovery option.

  If that fails, please reach out in Discord

## How do I turn on my camera?

- Fluiddpi ships with mjpgstreamer built in. Plug in your camera, navigate to
  the UI settings page, and enable the webcam.

## My camera is delayed, or slow

- Here's a couple of suggestions;
  - Some users have reported that their webcams were problematic when connected
    to the Pi4's USB2.0 ports. Try plugging your webcam into the USB3.0 port.

  - Because mjpg streams static images, this can saturate your wifi. Try
    reducing the fps and resolution of your images. See the `/boot/fluiddpi.txt`
    folder on your Pi for more information on how to do this. You can also
    try connecting to wired ethernet.

## Klipper updated and now my printer has an error

- Klipper likely has configuration changes. Please see
  [here](https://github.com/KevinOConnor/klipper/blob/master/docs/Config_Changes.md)
  for a list of recent changes.

## The host reboot / shutdown commands don't work

- Try jumping into `ssh` and running the following;

  ```bash
  ./moonraker/scripts/sudo-fix.sh
  ```

## My WiFi keeps dropping, is there anything I can do?

- Depending on your network configuration, sometimes the low power mode of the Pi's network adapter
  can cause issues. You can try fixing this by editing the `/etc/rc.local` file and adding the following
  to the bottom;

  ```bash
  iwconfig wlan0 power off
  ```

  Then rebooting.
  
## Why can't I see a total layer count in Fluidd?

- Klipper and Moonraker would need to expose this data to Fluidd in order for it to reliably present this
  information. Once this happens - Fluidd will show it.