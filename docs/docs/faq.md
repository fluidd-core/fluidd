---
title: FAQ
icon: lucide/circle-help
---

# FAQ

Answers to common questions about Fluidd, Klipper, and Moonraker.

## Setup & Configuration

### How do I use app.fluidd.xyz?

[app.fluidd.xyz](https://app.fluidd.xyz) is a hosted version of Fluidd that
runs entirely in your browser. It communicates directly with your printer on
your local network — no data leaves your network.

To use it, add `*://app.fluidd.xyz` to the `cors_domains` section of your
`moonraker.conf` and restart Moonraker. See
[Getting Started](/getting-started#fluiddxyz) for details.

### Fluidd cannot connect to my printer

Try these steps in order:

1. Verify Moonraker is running by opening
   `http://<your-printer>/server/info` in your browser. If this does not
   load, Moonraker is not running or not reachable.
2. Check the `cors_domains` section in your `moonraker.conf` — the host you
   are connecting from must be listed. See the
   [configuration example](/configuration#example-configuration).
3. Check the `trusted_clients` section — your IP range must be included.
4. If you are connecting from a different network or through a VPN, verify
   there are no firewall rules blocking the connection.

### My printer shows as disconnected

This usually means Klipper is not running or has encountered a configuration
error. Open the Fluidd console — if there is an error message, it will
describe what went wrong. Common fixes:

- Check your `printer.cfg` for syntax errors.
- Try running `FIRMWARE_RESTART` from the console.
- Restart the Klipper service from the [System page](/features/system-and-notifications).

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

### How do I back up my configuration?

Three options:

- **Fluidd settings backup** — go to Settings and use the backup and restore
  options to save or load your Fluidd UI settings (layout, theme, presets,
  macros, etc.).
- **Moonraker database backup** — go to the
  [System page](/features/system-and-notifications), find the database section, and click
  Create Backup to save a backup on the host. Use Restore to select and
  restore from an existing backup.
- **Config files** — your Klipper and Moonraker configuration files are
  stored in `~/printer_data/config`. You can copy this directory manually
  via SSH or use the [File Manager](/features/file-manager) to download
  individual files.

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

## Printing

### Does Fluidd show a total layer count?

Yes. Fluidd displays the current layer and total layer count during a print,
provided your slicer includes layer information in the G-code file.

### How do I set up Exclude Object?

Exclude Object lets you cancel individual objects mid-print. Three things are
required:

1. Enable **Label Objects** in your slicer.
2. Add an `[exclude_object]` section to your `printer.cfg`.
3. Set `enable_object_processing: True` in the `[file_manager]` section of
   your `moonraker.conf`.

Files must be uploaded after enabling these settings. See
[Printing — Exclude Object](/features/printing#exclude-object) for details.

### How do I upload files from my slicer?

See [Slicer Uploads](/features/slicer-uploads) for setup instructions
covering OrcaSlicer, PrusaSlicer, SuperSlicer, and Cura.

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

## Customization

### How do I change the dashboard layout?

Open the side menu and click **Adjust Layout**. You can drag cards between
columns, reorder them, or disable cards you don't need. Click the exit button
when done, or use **Reset Layout** to restore the defaults. See
[Customize](/customize#application-layout) for more details.

### How do I use a custom theme?

Create a `.fluidd-theme` folder in your configuration directory and upload a
`custom.css` file into it. Fluidd also supports custom backgrounds and logos.
See [Customize — Custom Themes](/customize#custom-themes) for details.
