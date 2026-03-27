---
title: FAQ
---

# FAQ

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

  - MJPEG streams can saturate your Wi-Fi. Try reducing the fps and resolution
    in your streamer configuration (e.g.
    [Crowsnest](https://crowsnest.mainsail.xyz/)). You can also try connecting
    to wired ethernet.

## Klipper updated and now my printer has an error

- Klipper likely has configuration changes. Please see
  the [Klipper config changes](https://www.klipper3d.org/Config_Changes.html) page
  for a list of recent changes. Common breaking changes include renamed
  parameters, deprecated options, and changed macro behavior.

## My probe or eddy current configuration stopped working after a Klipper update

- Klipper 0.13.0 introduced changes to probe eddy current parameters. The
  `z_offset` parameter was renamed to `descend_z`, and `speed`/`lift_speed`
  no longer apply to `METHOD=scan`, `METHOD=rapid_scan`, or `METHOD=tap`
  commands — these must be passed as command parameters instead. Check the
  [Klipper config changes](https://www.klipper3d.org/Config_Changes.html) page
  for details.

## The host reboot / shutdown commands don't work

- Try jumping into `ssh` and running the following;

  ```bash
  ./moonraker/scripts/sudo-fix.sh
  ```

## My Wi-Fi keeps dropping, is there anything I can do?

- Depending on your network configuration, sometimes the low power mode of the Pi's network adapter
  can cause issues. You can try fixing this by editing the `/etc/rc.local` file and adding the following
  to the bottom;

  ```bash
  iwconfig wlan0 power off
  ```

  Then rebooting.

## Does Fluidd show a total layer count?

- Yes. Fluidd displays the current layer and total layer count during a print,
  provided your slicer includes layer information in the G-code file.
