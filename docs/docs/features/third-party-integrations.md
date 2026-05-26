---
title: Third-Party Integrations
---

# Third-Party Integrations

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

[Happy Hare on GitHub](https://github.com/moggieuk/Happy-Hare){.md-button}

### AFC (Automated Filament Changer)

Dashboard card for
[AFC Klipper Add-On](https://github.com/ArmoredTurtle/AFC-Klipper-Add-On)
hardware (TurtleNeck, BoxTurtle, and others).

Features include:

- Hub and lane management
- Buffer status monitoring
- Extruder control
- LED state and stepper monitoring

Requires AFC-Klipper-Add-On installed on your Klipper instance.

[AFC-Klipper-Add-On on GitHub](https://github.com/ArmoredTurtle/AFC-Klipper-Add-On){.md-button}

## Probes & Sensors

### Beacon

Fluidd includes a [Beacon](https://docs.beacon3d.com/) eddy current probe
widget that appears automatically when the probe is detected. From this card
you can view probe samples, manage saved probe models, and save new models
directly from the UI. No extra Fluidd configuration is needed.

[Beacon documentation](https://docs.beacon3d.com/){.md-button}

### Cartographer / Scanner

Probe commands for [Cartographer](https://docs.cartographer3d.com/) and
Scanner devices are integrated into the Toolhead card. Two calibration
methods are accessible directly from the Toolhead card when the probe is
detected:

- **Scan calibration** — performs a full bed scan for mesh generation.
- **Touch calibration** — uses physical touch for Z offset calibration.

No extra Fluidd configuration is needed; the buttons appear automatically
when Fluidd detects a Cartographer or Scanner probe.

[Cartographer documentation](https://docs.cartographer3d.com/){.md-button}

### Other probes

Any probe configured in Klipper (`[probe]`, `[bltouch]`, `[smart_effector]`) is
automatically visible in Fluidd's Toolhead card with its current state. This
includes Smart Effector, Probe Eddy Current, and Load Cell sensors.
No extra Fluidd configuration is needed.

### Temperature & humidity sensors

Any sensor Klipper exposes is shown automatically. This includes AHT10/20/30,
BME280, BMP180/388, SHT3X, HTU21D, LM75, PT100/PT1000, and more. See
[Thermals](/features/thermals#sensors) for configuration examples.

## Kalico Firmware

[Kalico](https://docs.kalico.gg) (formerly Danger Klipper) is a community
fork of Klipper that adds advanced features for experienced users. Fluidd
detects Kalico automatically and adapts its interface — no extra configuration
is needed.

Kalico can be installed via [KIAUH](https://github.com/dw-0/kiauh) as an
alternative firmware.

### Features exposed in Fluidd

| Feature                            | Description                                                                                                                                                                                                                        |
|------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **MPC (Model Predictive Control)** | An alternative to PID for extruder temperature control. When configured (`control: mpc` in `[extruder]`), Fluidd shows an `MPC_CALIBRATE` button in the thermals card. See the [Kalico MPC docs](https://docs.kalico.gg/MPC.html). |
| **Non-critical MCUs**              | Mark microcontrollers as optional with `is_non_critical: true` in `[mcu]`. Fluidd gracefully disables controls for disconnected optional MCUs instead of showing errors.                                                           |
| **Dockable probes**                | Native support for Quickdraw, Klicky/Unklicky, and other dockable probe systems without external macros.                                                                                                                           |
| **Per-axis acceleration**          | Independent X/Y acceleration and velocity limits for CoreXY and CoreXZ kinematics, shown in the Toolhead card.                                                                                                                     |
| **Fan curves**                     | Temperature-based automatic fan speed curves.                                                                                                                                                                                      |
| **Python templates**               | Python math library available in Jinja2 macro templates for complex calculations.                                                                                                                                                  |
| **G-code shell commands**          | Execute shell commands directly from macros.                                                                                                                                                                                       |
| **Firmware retraction with Z-hop** | Built-in Z-hop support during firmware retractions.                                                                                                                                                                                |

For the full feature reference, see the
[Kalico documentation](https://docs.kalico.gg).

## Companion Services

### Spoolman

Filament spool tracking with QR code scanning, toolchanger support, and
print-start sanity checks. See [Spool Management](/features/multi-material#spool-management-spoolman)
for details.

[Spoolman on GitHub](https://github.com/Donkie/Spoolman){.md-button}

### Timelapse

Render and browse timelapse videos via Moonraker's timelapse component.
See [Timelapse](/features/timelapse) for details.

[moonraker-timelapse on GitHub](https://github.com/mainsail-crew/moonraker-timelapse){.md-button}

### Crowsnest

Recommended camera manager for Klipper setups. Fluidd recognizes
`crowsnest.conf` in the config file editor. See [Cameras](/features/cameras)
for supported streaming types.

[Crowsnest documentation](https://crowsnest.mainsail.xyz/){.md-button}

### KlipperScreen

Fluidd recognizes `klipperscreen.conf` for editing in the config file editor.

[KlipperScreen documentation](https://klipperscreen.github.io/KlipperScreen/){.md-button}

### Obico

[Obico](https://www.obico.io/) (formerly The Spaghetti Detective) provides
remote access to your full Fluidd interface from anywhere, AI-powered print
failure detection, and mobile apps for iOS and Android. It is 100% open-source
and can be self-hosted. Follow the
[Obico setup guide](https://obico.io/docs/user-guides/klipper-setup/) to get
started.

[Obico](https://www.obico.io/){.md-button}

### OctoEverywhere

[OctoEverywhere](https://octoeverywhere.com/) is a cloud service with a free
tier that provides remote access to your Fluidd interface with full-framerate
webcam streaming. Premium plans unlock Gadget AI print failure detection,
real-time notifications via Telegram, SMS, and Discord, and mobile app support
via Mobileraker and OctoApp.

[OctoEverywhere](https://octoeverywhere.com/){.md-button}
