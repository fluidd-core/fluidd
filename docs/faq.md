---
layout: default
title: FAQ
nav_order: 9
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

- Please see the [cameras feature](/features/cameras)

## I have an INVALID status for Fluidd, Moonraker or Klipper on the Update panel

- Updates can sometimes fail and cause this error. Your first option is to try
  Fluidd now provides a recovery option.

  If that fails, please reach out in Discord

## How do I turn on my camera?

- Navigate to the UI Settings page and add a new camera. Fluidd supports
  multiple camera types including MJPEG, HLS, and WebRTC. See the
  [cameras feature](/features/cameras) for details.

## My camera is delayed, or slow

- Here's a couple of suggestions;
  - Some users have reported that their webcams were problematic when connected
    to the Pi4's USB2.0 ports. Try plugging your webcam into the USB3.0 port.

  - MJPEG streams can saturate your WiFi. Try reducing the fps and resolution
    in your streamer configuration (e.g.
    [Crowsnest](https://crowsnest.mainsail.xyz/)). You can also try connecting
    to wired ethernet.

## Klipper updated and now my printer has an error

- Klipper likely has configuration changes. Please see
  [here](https://www.klipper3d.org/Config_Changes.html)
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
  
## Does Fluidd show a total layer count?

- Yes. Fluidd displays the current layer and total layer count during a print,
  provided your slicer includes layer information in the gcode file.
