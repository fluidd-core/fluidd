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

Then you should have something like this on your Tailscale, under Machines tab
![screenshot](/assets/images/tailscale1.png)


### Moonraker

On your moonraker.conf file you need to add permissions to your smartphone/computer be able to access your 3D printer using Tailscale

Add your smartphone/computer tailscale IP under “trusted_clients” in "authorization" section
```
[authorization]
enabled: True
cors_domains:
  *.local
  *.lan
  *://app.fluidd.xyz

trusted_clients:
  10.0.0.0/8
  127.0.0.0/8
  169.254.0.0/16
  172.16.0.0/12
  192.168.0.0/16
  FE80::/10
  ::1/128
  
  100.115.167.93

```
Note that it is the remote device IP and not the RPi IP


### Fluidd

At this point you should be able to access your [Fluidd](https://fluidd.xyz) UI outside your home/office network.
In your smartphone/computer, not connected to your home/office network, make sure Tailscale client is running and active, try to access your Raspberry Pi using Tailscale IP.

In the case of the example, it's [http://100.99.160.51](http://100.99.160.51)

Then you just need to add your printer with Tailscale IP
![screenshot](/assets/images/tailscale2.png)

