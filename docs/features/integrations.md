---
layout: default
title: Third-Party Integrations
parent: Features
nav_order: 21
permalink: /features/integrations
---

# Third-Party Integrations
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Fluidd integrates with a wide range of third-party hardware and software
projects in the Klipper ecosystem. This page lists the integrations that have
dedicated UI support beyond basic Klipper config editing.

## Multi-Material Systems

### Happy Hare (MMU)

Full dashboard integration for
[Happy Hare](https://github.com/moggieuk/Happy-Hare)-managed multi-material
units (ERCF, Tradrack, and others).

Features include:

- Gate map visualization and filament status
- Tool management and maintenance dialogs
- Clog and tangle detection via Flowguard
- Sync-feedback buffer rendering
- Espooler display
- Endless spool support

Requires Happy Hare installed on your Klipper instance. Fluidd will
automatically show the MMU dashboard card when it detects the `mmu` Klipper
object.

### AFC (Automated Filament Changer)

Dashboard card for
[AFC Klipper Add-On](https://github.com/AFC-Klipper-Add-On/AFC-Klipper-Add-On)
hardware (TurtleNeck, BoxTurtle, and others).

Features include:

- Hub and lane management
- Buffer status monitoring
- Extruder control
- LED state and stepper monitoring

Requires AFC-Klipper-Add-On installed on your Klipper instance.

## Probes & Sensors

### Beacon

Dedicated widget for the [Beacon](https://docs.beacon3d.com/) eddy current
probe. You can view probe samples, manage saved probe models, and save new
models directly from the UI.

### Cartographer / Scanner

Probe commands for [Cartographer](https://docs.cartographer3d.com/) and
Scanner devices are integrated into the Toolhead card.

### Other probes

Fluidd displays state for Smart Effector, Probe Eddy Current, and Load Cell
sensors when configured in Klipper. No extra Fluidd configuration is needed.

### Temperature & humidity sensors

Any sensor Klipper exposes is shown automatically. This includes AHT10/20/30,
BME280, SHT3X, HTU21D, LM75, PT100/PT1000, and more. See
[Sensors](/features/sensors) for configuration examples.

## Kalico Firmware

Fluidd detects [Kalico](https://docs.kalico.gg) (and Danger Klipper) and
adapts its interface to the firmware automatically. Firmware-specific objects
and commands exposed by Kalico are available through Fluidd’s existing
panels, such as the Console, Macros list, and standard toolhead and sensor
cards.
No extra configuration is needed — Fluidd adapts when it detects the firmware
variant.

## Companion Services

### Spoolman

Filament spool tracking with QR code scanning, toolchanger support, and
print-start sanity checks. See [Spool Management](/features/spoolman) for
details.

[Spoolman on GitHub](https://github.com/Donkie/Spoolman){: .btn .fs-5 .mb-4 .mb-md-0 }

### Timelapse

Render and browse timelapse videos via Moonraker's timelapse component.
See [Timelapse](/features/timelapse) for details.

[moonraker-timelapse on GitHub](https://github.com/mainsail-crew/moonraker-timelapse){: .btn .fs-5 .mb-4 .mb-md-0 }

### Crowsnest

Recommended camera manager for Klipper setups. Fluidd recognizes
`crowsnest.conf` in the config file editor. See [Cameras](/features/cameras)
for supported streaming types.

[Crowsnest documentation](https://crowsnest.mainsail.xyz/){: .btn .fs-5 .mb-4 .mb-md-0 }

### KlipperScreen

Fluidd recognizes `klipperscreen.conf` for editing in the config file editor.

[KlipperScreen documentation](https://klipperscreen.github.io/KlipperScreen/){: .btn .fs-5 .mb-4 .mb-md-0 }

### Obico

Remote access and AI-powered print failure detection. See the
[configuration guide](/configuration/obico_for_remote_access) for setup
instructions.

[Obico](https://www.obico.io/){: .btn .fs-5 .mb-4 .mb-md-0 }

### OctoEverywhere

Free remote access with AI monitoring (Gadget) and webcam streaming. See the
[configuration guide](/configuration/octoeverywhere_free_remote_access) for
setup instructions.

[OctoEverywhere](https://octoeverywhere.com/){: .btn .fs-5 .mb-4 .mb-md-0 }
