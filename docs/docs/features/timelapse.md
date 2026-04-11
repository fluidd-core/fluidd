---
title: Timelapse
---

# Timelapse

Fluidd integrates with Moonraker's
[timelapse](https://github.com/mainsail-crew/moonraker-timelapse) component,
providing a dedicated view for managing timelapse recordings.

## Setup

Install and configure the Moonraker timelapse component following the
[moonraker-timelapse documentation](https://github.com/mainsail-crew/moonraker-timelapse).
Once enabled, a Timelapse entry appears in the main navigation.

## Recording modes

- **Layer macro** (default) — captures a frame at each layer change using a
  G-code macro inserted by the slicer
- **Hyperlapse** — captures frames at a fixed time interval (configurable cycle
  time)

## Timelapse page

The Timelapse page provides:

- **File browser** — browse, download, and delete completed timelapse videos
  and thumbnails using the standard file manager
- **Live status** — preview captured frames during an active print with a
  frame scrubber
- **Render control** — trigger video rendering manually or enable auto-render
  on print completion

## Settings

Timelapse settings are available in Settings — Timelapse. Some settings may be
managed by Moonraker and appear as read-only.

**General:**

- Camera selection
- Recording mode (layer macro or hyperlapse)
- Stream delay compensation
- Verbose G-code output

**Toolhead parking** — optionally park the toolhead before capturing each
frame:

- Park position (front-left, back-right, center, custom, etc.)
- Custom X/Y coordinates and Z offset
- Travel speed
- Retract/extrude distances and speeds
- Firmware retraction support

**Render settings:**

- Fixed or variable frame rate (with min/max FPS and target length)
- Quality (CRF value — Constant Rate Factor; lower values mean higher quality
  and larger file size, higher values mean smaller files with more compression;
  typical range is 17–28 for H.264)
- Duplicate last frame count
- Save raw frames after rendering
- Generate preview thumbnail

## Troubleshooting

### Timelapse entry does not appear in the navigation menu

The Timelapse page only appears when the Moonraker timelapse component is
installed and enabled. Follow the
[moonraker-timelapse setup guide](https://github.com/mainsail-crew/moonraker-timelapse)
and restart Moonraker. After restarting, reload Fluidd.

### No frames captured during the print

- **Layer macro mode** — your slicer must insert the `TIMELAPSE_TAKE_FRAME`
  macro at each layer change. Check your slicer's post-processing or
  "after layer change" G-code settings.
- **Hyperlapse mode** — ensure the `TIMELAPSE_RENDER` macro is called at
  print end (usually via your `PRINT_END` macro or slicer end G-code).
- Verify the camera is configured and the stream URL is reachable — the
  timelapse component captures frames from the camera feed.

### Video rendering fails

- Check Moonraker's log (`~/printer_data/logs/moonraker.log`) for render
  errors. FFmpeg is required — ensure it is installed on the host.
- If raw frames were saved (enabled in Render settings), you can re-render
  manually using FFmpeg outside of Fluidd.
