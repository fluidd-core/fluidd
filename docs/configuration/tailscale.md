---
layout: default
title: Tailscale
parent: Configuration
nav_order: 1
permalink: /configuration/tailscale
---

# Tailscale
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Tailscale is a VPN solution that allows you to access your home devices anywhere without the need to open/forward ports in your router, making this an awesome solution to access your Fluidd/Klipper powered 3D printer when you are not in the same network as your printer.
All this communication is encrypted, so only your the devices (smartphone/laptop/tablet/etc) have access.

To do this you will need a Google or Microsoft account, as those are the only ways to register on [Tailscale](https://www.tailscale.com) platform.

### Installation

  - Register on [Tailscale](https://www.tailscale.com)
  - Install [Tailscale client](https://www.tailscale.com/download) on your device that you want to use to access your 3D printer (you can install in more then one)
  - Install [Tailscale Client](https://tailscale.com/download/linux/rpi) on your Raspberry Pi

After this you should have something like this on your Tailscale, under Machines tab
![screenshot](/assets/images/tailscale1.png)
