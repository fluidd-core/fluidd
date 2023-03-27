---
layout: home
title: Welcome
nav_order: 1
description: >-
  Fluidd is the Klipper UI. Focused on usability, flexibility and a
  responsive experience
permalink: /
---

# Welcome to Fluidd
{: .fs-9 }

Fluidd is a lightweight & responsive user interface for Klipper, the 3D printer
firmware.
{: .fs-6 .fw-300 }

[Get Started](/installation){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/fluidd-core/fluidd){: .btn .fs-5 .mb-4 .mb-md-0 .mr-2 }
[Release Notes](https://github.com/fluidd-core/fluidd/releases){: .btn .fs-5 .mb-4 .mb-md-0 }

![screenshot](/assets/images/preview_sliced.png)

## Features

- Responsive UI, supports desktop, tablets and mobile
- [Customizable layouts](/customize/layout). Move any panel where YOU want
- Built-in [color themes](/customize/themes)
- Manage [multiple printers](/features/printers) from one Fluidd install
- [Notifications](/features/notifications) on Pi throttling + more
- [Macro organization](/features/macros)
- Full [localization](/development/localization) (i18n) support
- View and Edit your Klipper config in app with code folding and Codelens support
- View and Edit your Gcode files in app
- [Bed Mesh](/features/bed_mesh) levelling
- [Thermal Presets](/features/presets)
- [Multiple web cam](/features/cameras) support
- Control power devices - GPIO (relays), TPLink Smartplug, and Tasmota
- [Print history](/features/print_history)
- [Version management](/updates/automated) and upgrades
- Utilization graphs

## Supporting Fluidd

Fluidd was created by [Craig Bassett](https://github.com/cadriel) and is currently
developed and maintained by the [Fluidd team](https://github.com/orgs/fluidd-core/people)
and our contributors - along with support from the entire Klipper Team, associated
printer communities and you, the user.

## Docker

Fluidd ships with Docker support built in. The official docker can be found
[here](https://github.com/fluidd-core/fluidd/pkgs/container/fluidd), and further information can be found [here](/installation/docker).

## Support

Primary support is provided via Discord, or Github Issues.

[Discord](https://discord.gg/GZ3D5tqfcF){: .btn .fs-5 .mb-4 .mb-md-0 .mr-2 }
[GitHub Issues](https://github.com/fluidd-core/fluidd/issues){: .btn .fs-5 .mb-4 .mb-md-0 }

## Did you know?

You can submit changes to these docs! At the bottom of every page is an option
to edit this page. Any help is appreciated.

## Architecture

Fluidd relies on [Moonraker](https://github.com/Arksine/moonraker/tree/master/docs) and
[Klipper](https://www.klipper3d.org/) to function. To learn more about the
architecture and how these components work together, visit the development
resources [here](/development).
