---
layout: default
title: FAQ
nav_order: 7
permalink: /faq
---

# FAQ
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Klipper updated and now my printer has an error

- Klipper likely has configuration changes. Please see
  [here](https://github.com/KevinOConnor/klipper/blob/master/docs/Config_Changes.md)
  for a list of recent changes.

## The host reboot / shutdown commands don't work

- Try jumping into `ssh` and running the following;

  ```bash
  ./moonraker/scripts/sudo-fix.sh
  ```

## My WiFi keeps dropping, is there anything I can do?

- Depending on your network configuration, sometimes the low power mode of the Pi's network adapter
  can cause issues. You can try fixing this by editing the `/etc/rc.local` file and adding the following
  to the bottom;

  ```bash
  iwconfig wlan0 power off
  ```

  Then rebooting.
  
## Why can't I see a total layer count in Fluidd?

- Klipper and Moonraker would need to expose this data to Fluidd in order for it to reliably present this
  information. Once this happens - Fluidd will show it.