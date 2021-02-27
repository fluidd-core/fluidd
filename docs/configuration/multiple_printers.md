---
layout: default
title: Multiple Printers
parent: Configuration
nav_order: 3
permalink: /configuration/multiple_printers
---

# Multiple Printers
{: .no_toc }

---

Fluidd allows you to connect to multiple printers from a single host.
Your moonraker configuration for each printer you wish to connect to is
likely going to require specific setup in order for this configuration to work.

This type of setup is also highly dependent on your network environment.

Reading through the documentation surrounding `cors_domains` in the
[moonraker document]((/configuration/moonraker_conf#cors-domains)) should
help explain some requirements.

### Example

Assuming you have a single host setup with Fluidd, by way of a
[docker installation](/installation/docker) or
[fluiddpi installation](/installation/fluiddpi);

1. Note the URL you use to access Fluidd
   - For this example, let's assume you access Fluidd on `http://myfancyprinter`

2. For every printer you wish to connect to, ensure the above URL is in the
   `cors_domains` section of your `moonraker.conf`.
   E.g.,

   ```yaml
   cors_domains:
     http://myfancyprinter
   ```

3. On your fluidd host, when adding a new printer url - add the full host
   as per above, E.g., `http://myfancyprinter`.

The `cors_domains` section does allow for wildcards to make this easier, and
FluiddPI ships with sane defaults. You can see an example
[here](/configuration/moonraker_conf) of a configuration that works for
`http://app.fluidd.xyz` along with many other common network setups.
