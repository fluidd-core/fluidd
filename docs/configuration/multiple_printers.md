---
layout: default
title: Multiple Printers
parent: Configuration
nav_order: 3
permalink: /configuration/multiple_printers
---

# Multiple Printers
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Fluidd allows you to connect to multiple printers from a single host.
Your moonraker configuration for each printer you wish to connect to is
likely going to require specific setup in order for this configuration to work.

This type of setup is also highly dependent on your network environment.

Reading through the documentation surrounding `cors_domains` in the
[moonraker config docs](/configuration/moonraker#cors-domains) should
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

### Troubleshooting

If you're entering a printer URL into the add printer dialog, but Fluidd won't let me save...

Fluidd won't let you save a new printer if it can't confirm moonraker is running. To
confirm a moonraker printer instance, try browsing directly to the moonraker API;

```yaml
http://myprinter.local/printer/info
# or;
http://myprinter.local:7125/printer/info
```

Be sure to replace `myprinter.local` with the host you're trying to connect to.

If neither of the above url examples work, then moonraker is incorrectly configured
on your printer.

If they do return a valid response, but fluidd still won't allow you to save,
then refer to the above configuration example to ensure moonraker is configured
to accept connections from your fluidd host.
