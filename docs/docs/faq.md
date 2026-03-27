---
title: FAQ
icon: lucide/circle-help
---

# FAQ

Answers to common questions about Fluidd, Klipper, and Moonraker.

## Setup & Configuration

### Klipper updated and now my printer has an error

Klipper likely has configuration changes. See the
[Klipper config changes](https://www.klipper3d.org/Config_Changes.html) page
for a list of recent changes. Common breaking changes include renamed
parameters, deprecated options, and changed macro behavior.

### My probe or eddy current configuration stopped working after a Klipper update

Klipper 0.13.0 introduced changes to probe eddy current parameters. The
`z_offset` parameter was renamed to `descend_z`, and `speed`/`lift_speed`
no longer apply to `METHOD=scan`, `METHOD=rapid_scan`, or `METHOD=tap`
commands — these must be passed as command parameters instead. Check the
[Klipper config changes](https://www.klipper3d.org/Config_Changes.html) page
for details.

### I have an INVALID status for Fluidd, Moonraker, or Klipper on the Update panel

Updates can sometimes fail and cause this error. Fluidd provides a recovery
option — try that first. If it fails, reach out on
[Discord](https://discord.gg/GZ3D5tqfcF).

## Cameras

### How do I turn on my camera?

Navigate to the UI Settings page and add a new camera. Fluidd supports
multiple camera types including MJPEG, HLS, and WebRTC. See
[Cameras](/features/cameras) for details.

### I'd like to set up multiple cameras

See the [cameras feature](/features/cameras) for supported stream types
and configuration.

### My camera is delayed or slow

A few suggestions:

- Some users have reported issues when webcams are connected to the Pi 4's
  USB 2.0 ports. Try the USB 3.0 port.
- MJPEG streams can saturate Wi-Fi. Try reducing the frame rate and
  resolution in your streamer configuration (e.g.
  [Crowsnest](https://crowsnest.mainsail.xyz/)). Wired ethernet also helps.

## System

### The host reboot / shutdown commands don't work

Try running the following over SSH:

```bash
./moonraker/scripts/sudo-fix.sh
```

### My Wi-Fi keeps dropping

The Pi's network adapter low-power mode can cause issues. Try adding the
following to `/etc/rc.local` and rebooting:

```bash
iwconfig wlan0 power off
```

## Printing

### Does Fluidd show a total layer count?

Yes. Fluidd displays the current layer and total layer count during a print,
provided your slicer includes layer information in the G-code file.
