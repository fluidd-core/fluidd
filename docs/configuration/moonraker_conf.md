---
layout: default
title: moonraker.conf
parent: Configuration
nav_order: 5
permalink: /configuration/moonraker_conf
---

# moonraker.conf
{: .no_toc }

---

This is an example configuration, which should apply to most users.
Your moonraker configuration can usually be found here: `~/klipper_config/moonraker.conf`

```yaml
[server]
host: 0.0.0.0
port: 7125

[file_manager]
# cancel object preprocessing - set to True to enable; leave disabled when running on a low-powered device (e.g. Pi Zero)
enable_object_processing: False

[data_store]
temperature_store_size: 600
gcode_store_size: 1000

[authorization]
force_logins: false

cors_domains:
  *.local
  *.lan
  *://localhost
  *://app.fluidd.xyz

trusted_clients:
  10.0.0.0/8
  127.0.0.0/8
  169.254.0.0/16
  172.16.0.0/12
  192.168.0.0/16
  FE80::/10
  ::1/128

[history]

[octoprint_compat]

[update_manager]
enable_auto_refresh: True

[announcements]
subscriptions:
  fluidd

[update_manager fluidd]
type: web
repo: fluidd-core/fluidd
path: ~/fluidd
```
