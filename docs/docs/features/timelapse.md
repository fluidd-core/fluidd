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
- Quality (CRF value)
- Duplicate last frame count
- Save raw frames after rendering
- Generate preview thumbnail
