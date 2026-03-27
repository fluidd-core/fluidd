---
title: System & Notifications
---

# System & Notifications

Manage your host machine, services, and stay informed about issues that need
attention.

## System

The System page gives you an overview of your host machine and the services
running alongside Klipper.

From here you can:

- **View system information** — hostname, operating system, CPU and memory
  usage.
- **Manage services** — start, stop, or restart Klipper, Moonraker, and other
  registered services.
- **Manage the Moonraker database** — back up and restore your Moonraker
  database, or clear individual namespaces when troubleshooting.

## Notifications

Fluidd has a built-in notification system that warns you of potential issues:

- **Pending updates** — shown when Klipper, Moonraker, Fluidd, or other
  components have updates available.
- **Throttle conditions** — fires when the host reports throttling (e.g.
  undervoltage or thermal throttling on a Raspberry Pi via `vcgencmd`).
- **Moonraker announcements** — important messages from the Fluidd developers
  and maintainers, delivered via the `[announcements]` Moonraker component.

![screenshot](/assets/images/notifications.png)
