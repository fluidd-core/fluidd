---
title: Updates
---

# Updates

Fluidd allows you to update all of its components, including the host system in an automated way.
It will notify you of available updates — and provide buttons to upgrade each individual component.

## Automated Updates

The recommended order of updates is:

1. Klipper — firmware changes may affect Moonraker or Fluidd behavior
2. Moonraker — API changes should be applied before updating frontends
3. Fluidd
4. Other clients

Klipper can be skipped if you have a reason to not update it immediately.

Update requests are blocked while a print is in progress.

In order for this feature to be enabled, you need to configure Moonraker's
update plugin. See the
[Moonraker configuration](/configuration#example-configuration) docs. For
advanced options (custom repositories, pinned branches, etc.), see the
[Moonraker update_manager documentation](https://moonraker.readthedocs.io/en/latest/configuration/#update_manager).

![screenshot](/assets/images/updates.png)

## Recovery

If an update fails and a component shows an **INVALID** status, Fluidd
provides a recovery button — click it to attempt automatic repair. If
recovery does not resolve the issue, you can update the component manually
via SSH (see [Manual Updates](#manual-updates) below) or reach out on
[Discord](https://discord.gg/GZ3D5tqfcF).

## Updating via KIAUH

If you installed Klipper, Moonraker, or Fluidd using
[KIAUH](https://github.com/dw-0/kiauh), you can also update them through the
KIAUH menu. Launch KIAUH and select the update option to update any installed
component.

## Manual Updates

On an already configured system, you can manually update as follows;

### Fluidd

```bash
# Update files
cd ~/fluidd
rm -R ./*
rm .version
wget -q -O fluidd.zip https://github.com/fluidd-core/fluidd/releases/latest/download/fluidd.zip
unzip fluidd.zip
rm fluidd.zip

# Restart services
sudo systemctl restart nginx
```

### Moonraker

For manual Moonraker updates, refer to the
[Moonraker installation docs](https://moonraker.readthedocs.io/en/latest/installation/)
as the update procedure has changed across versions. The basic steps are:

```bash
cd ~/moonraker
git pull
./scripts/install-moonraker.sh
sudo systemctl restart moonraker
```

### Klipper

Note, this guide does not cover MCU updates should one be required after a klipper update.

```bash
cd ~/klipper
git pull
sudo systemctl restart klipper
```

### Host Restart

If you wish to restart your host;

```bash
# To reboot your host.
sudo reboot
```
