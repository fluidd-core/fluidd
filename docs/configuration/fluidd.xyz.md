---
layout: default
title: fluidd.xyz
parent: Configuration
nav_order: 4
permalink: /configuration/fluidd_xyz
---

# fluidd.xyz
{: .no_toc }

---

Have Mainsail installed, or don't want to install Fluidd locally? We support that!

Fluidd is also hosted at `http://app.fluidd.xyz`. When used in this way,
Fluidd is downloaded to your browser.

It has no interaction outside of your network unless configured to do so, and
essentially works in the same way as hosting Fluidd yourself.

FluiddPi comes OOB with support for this configuration built in.

If you've installed in some other way, then in order for Fluidd to connect to
your printer, you'll need to configure Moonraker.

In the `moonraker.conf` file is a section called `cors_domains:`.
The fluidd.xyz host must be in this section for a successful connection to be
made.

Generally, you can find the moonraker.conf file here
`~/klipper_configuration/moonraker.conf` for FluiddPi and Mainsail installs.

Alternatively, you can edit the file via the file browser in Fluidd.

A suitable example can be found [here](/configuration/moonraker_conf).
