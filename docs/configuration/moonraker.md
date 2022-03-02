---
layout: default
title: Moonraker
parent: Configuration
nav_order: 2
permalink: /configuration/moonraker
---

# Moonraker
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Moonraker is the API that fluidd communicates with, which in turn communicates with Klipper.
All three components are required for a healthy printer.

For more detailed instructions, please refer to Arksine's documentation for
[installation](https://moonraker.readthedocs.io/en/latest/installation/)
and
[configuration](https://moonraker.readthedocs.io/en/latest/configuration/)

## [server] block

This configures the general configuration of your moonraker instance. In most
cases, you shouldn't need to touch anything here.

## [file_manager] block

If you have a FluiddPI installation of `1.14` or below, it may be worth adding a
logs path, which will expose all logs inside of Fluidd. [KIUAH](/installation/kiauh) can
provide a gracefull upgrade path in order to re-arrange all of your logs into
the same place for this to be most benifical.

```yaml
log_path: ~/klipper_logs
```

See the [configuration example](/configuration/moonraker_conf) where this belongs.

## [data_store] block

Temperature and gcode store sizes can be configured in moonraker.
This is especially useful for temperature store data, as it
directly affects how much time data is stored on the X axes of
the thermals graph.

Temperature store size is in seconds, while the gcode store size is defined
in an entry count.

```yaml
temperature_store_size: 600
gcode_store_size: 1000
```

## [authorization] block

This configures the authorization required to access the moonraker API.
Normally, this is enabled. Fluiddpi provides a default configuration that
applies to most users network requirements, however - sometimes changes are
required to meet specific needs.

### Cors Domains

Cors Domains are a list of host names that are allowed to communicate with
moonraker.

If your IP address falls under the trusted clients, moonraker should allow
your host to connect without changes.
However, if you're having trouble - or otherwise attempting
to connect from a unique location, you may need to add an entry into the `cors_domains`
block.

You can enter an address as a wildcard or full host. The
[configuration example](/configuration/moonraker_conf) provides configuration that should work
for most users.

Protocols are required, but can be ommitted with the use of wildcards.

### Trusted Clients

Trusted clients are a list of ip ranges that moonraker will accept communication
from. The default list in the [configuration example](/configuration/moonraker_conf) covers
most user configurations for internal networks. Note that these ranges are in CIDR
format.

## [history] block

Enables job history. Also provides benefits such as being able to reprint
failed or cancelled prints, and sorting your filesystem by last print time.

See the [feature docs](/features/print_history) for more explanation of these features.

## [octoprint_compat] block

This enables the slicer upload feature, allowing PrusaSlicer, SuperSlicer and
Cura users to directly upload gcodes. See the
[configuration example](/configuration/moonraker_conf).

## [update_manager] block / Automated Updates

Automated updates can be configured by ensuring the following is in your
`moonraker.conf`.

```yaml
[update_manager]
enable_auto_refresh: True

[update_manager client fluidd]
type: web
repo: fluidd-core/fluidd
path: ~/fluidd
```

## Example Configuration

A full, usable configuration can be [found here.](/configuration/moonraker_conf)
