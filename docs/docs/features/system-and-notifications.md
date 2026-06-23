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
  database, or clear individual namespaces when troubleshooting. Click
  **Create Backup** to have Moonraker create a backup on the host, and
  **Restore** to select and restore from an existing backup.

## Peripherals

The System page can detect and display connected hardware peripherals. This
is useful for verifying that devices are recognized without needing to SSH
into your host:

- USB devices
- Serial devices
- CAN bus devices
- V4L2 video devices
- Libcamera devices

## Power devices

!!! note "Moonraker configuration required"
    Power device controls require Moonraker's `[power]` component to be
    configured. See the
    [Moonraker power documentation](https://moonraker.readthedocs.io/en/latest/configuration/#power)
    for setup details and supported device types.

When configured, Fluidd displays power device controls on the dashboard and
in the top navigation bar. You can toggle devices on and off directly from
the UI.

## Sensors

!!! note "Moonraker configuration required"
    The Sensors card shows generic sensors exposed via Moonraker's `[sensor]`
    component (for example power meters or environmental sensors). See the
    [Moonraker sensor documentation](https://moonraker.readthedocs.io/en/latest/configuration/#sensor)
    for setup details and supported sensor types.

These are distinct from the Klipper temperature sensors shown in the
[Thermals](thermals.md) chart.

The **Sensors** dashboard card lists each configured sensor as a collapsible
panel:

- The panel header shows the sensor's friendly name and the current value of
  each of its measurements.
- Expand a panel to see a real-time history chart for every numeric
  measurement. Sensors with no numeric measurements show **No data**.

## Notifications

Fluidd has a built-in notification system that warns you of potential issues:

- **Pending updates** — shown when Klipper, Moonraker, Fluidd, or other
  components have updates available.
- **Outdated Moonraker** — a warning shown when the connected Moonraker is
  older than the minimum version Fluidd supports, with a link to the versions
  list in Settings.
- **Throttle conditions** — fires when the host reports throttling (e.g.
  undervoltage or thermal throttling on a Raspberry Pi via `vcgencmd`).
- **Moonraker announcements** — important messages from the Fluidd developers
  and maintainers, delivered via the `[announcements]` Moonraker component.
- **Failed components** — if a Moonraker component fails to load, Fluidd
  displays a warning with the component name and error details.

![Notifications panel showing Moonraker announcements and component warnings](/assets/images/notifications.png)
