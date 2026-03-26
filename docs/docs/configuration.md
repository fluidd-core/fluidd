---
title: Configuration
---

# Configuration

Because Fluidd relies on Moonraker and Klipper, configuration needs to happen
in more than one location. Start with the initial setup section to ensure you
have the basic requirements in place first.

## Initial Setup

Fluidd requires some basic configuration to be applied in order to function
correctly. Fluidd should warn you if these are not found in your configuration
upon startup.

## Klipper

Klipper is the printer firmware that Fluidd communicates with via Moonraker.
The following sections must be present in your `printer.cfg` for Fluidd to function correctly.

For more detailed instructions, please refer to the [Klipper documentation](https://www.klipper3d.org/Config_Reference.html).

### [virtual_sdcard]

Fluidd requires your printer be setup with `virtual_sdcard`. This allows
file uploads to work correctly. If you get a gcodes path not found error in
Fluidd this is generally the first place to look.

```ini
[virtual_sdcard]
path: ~/printer_data/gcodes
```

### [display_status]

Required to properly support display updates in fluidd- with no other lines required.

```ini
[display_status]
```

### [pause_resume]

Enables Pause / Resume functionality within klipper. This is a single block, with no other lines required.

```ini
[pause_resume]
```

### Macros

These can be assumed sane defaults, but should be checked and modified to your own needs.

#### PAUSE

```ini
[gcode_macro PAUSE]
description: Pause the actual running print
rename_existing: PAUSE_BASE
# change this if you need more or less extrusion
variable_extrude: 1.0
gcode:
  ##### read E from pause macro #####
  ##### set park positon for x and y #####
  # default is your max posion from your printer.cfg
  ##### calculate save lift position #####
  ##### end of definitions #####
  PAUSE_BASE
  G91
    G1 E-{E} F2100
    {action_respond_info("Extruder not hot enough")}
    G1 Z{z_safe} F900
    G90
    G1 X{x_park} Y{y_park} F6000
    {action_respond_info("Printer not homed")}
```

#### RESUME

```ini
[gcode_macro RESUME]
description: Resume the actual running print
rename_existing: RESUME_BASE
gcode:
  ##### read E from pause macro #####
  #### get VELOCITY parameter if specified ####
  ##### end of definitions #####
    G91
    G1 E{E} F2100
    {action_respond_info("Extruder not hot enough")}
  RESUME_BASE {get_params}
```

#### CANCEL_PRINT

```ini
[gcode_macro CANCEL_PRINT]
description: Cancel the actual running print
rename_existing: CANCEL_PRINT_BASE
gcode:
  TURN_OFF_HEATERS
  CANCEL_PRINT_BASE
```

## Moonraker

Moonraker is the API that fluidd communicates with, which in turn communicates with Klipper.
All three components are required for a healthy printer.

For more detailed instructions, please refer to the [Moonraker documentation](https://moonraker.readthedocs.io/en/latest/configuration/).

### [server]

This configures the general configuration of your moonraker instance. In most
cases, you shouldn't need to touch anything here.

### [file_manager]

If you want to be able to cancel single objects on a multi-object print, then
you will need to set `enable_object_processing: True` here to enable it.

```ini
[file_manager]
enable_object_processing: True
```

### [data_store]

Temperature and gcode store sizes can be configured in moonraker.
This is especially useful for temperature store data, as it
directly affects how much time data is stored on the X axes of
the thermals graph.

Temperature store size is in seconds, while the gcode store size is defined
in an entry count.

```ini
[data_store]
temperature_store_size: 600
gcode_store_size: 1000
```

### [authorization]

This configures the authorization required to access the moonraker API.
Normally, this is enabled. Your installation method may provide a default
configuration that applies to most users network requirements, however -
sometimes changes are required to meet specific needs.

#### Cors Domains

Cors Domains are a list of host names that are allowed to communicate with
moonraker.

If your IP address falls under the trusted clients, moonraker should allow
your host to connect without changes.
However, if you're having trouble - or otherwise attempting
to connect from a unique location, you may need to add an entry into the `cors_domains`
block.

You can enter an address as a wildcard or full host. The
[configuration example](#example-configuration) provides configuration that should work
for most users.

Protocols are required, but can be omitted with the use of wildcards.

#### Trusted Clients

Trusted clients are a list of ip ranges that moonraker will accept communication
from. The default list in the [configuration example](#example-configuration) covers
most user configurations for internal networks. Note that these ranges are in CIDR
format.

### [history]

Enables job history. Also provides benefits such as being able to reprint
failed or cancelled prints, and sorting your filesystem by last print time.

See the [feature docs](/features/print_history) for more explanation of these features.

### [octoprint_compat]

This enables the slicer upload feature, allowing PrusaSlicer, SuperSlicer and
Cura users to directly upload gcodes. See the
[configuration example](#example-configuration).

### [announcements]

Enables Moonraker announcements for Fluidd, so that any important Fluidd message
from the developers and maintainers is shown in the Fluidd notifications.

```ini
[announcements]
subscriptions:
  fluidd
```

### [update_manager]

Automated updates can be configured by ensuring the following is in your
`moonraker.conf`.

```ini
[update_manager]
enable_auto_refresh: True

[update_manager fluidd]
type: web
repo: fluidd-core/fluidd
path: ~/fluidd
```

### Example Configuration

This is an example configuration which should apply to most users.
Your moonraker configuration can usually be found here: `~/printer_data/config/moonraker.conf`

```ini
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

## Multiple Printers

Fluidd allows you to connect to multiple printers from a single host.
Your moonraker configuration for each printer you wish to connect to
may require specific setup in order for this configuration to work.

This type of setup is also highly dependent on your network environment.

Reading through the documentation surrounding `cors_domains` in the
[Moonraker section](#cors-domains) should help explain some requirements.

### Example

Assuming you have a single host setup with Fluidd, by way of a
[docker installation](/installation#docker) or
[KIAUH installation](/installation#kiauh);

1. Note the URL you use to access Fluidd
   - For this example, let's assume you access Fluidd on `http://fluidd.local`

2. On your fluidd host, when adding a new printer url - add the full address
   to your printer E.g., `http://myprinter.local`.

3. If step #2 fails
   - Make sure moonraker is running, and accessable. You can try to directly test
     moonraker by going here; `http://myprinter.local/server/info`. If this URL
     works, and you still can't connect - please review the
     [Moonraker section](#cors-domains)

You can see an [example configuration](#example-configuration) that works for
`http://app.fluidd.xyz` along with many common network setups.

### Troubleshooting

If you're entering a printer URL into the add printer dialog, but Fluidd won't let me save...

Fluidd won't let you save a new printer if it can't confirm moonraker is running. To
confirm a moonraker printer instance, try browsing directly to the moonraker API;

```text
http://myprinter.local/server/info
# or;
http://myprinter.local:7125/server/info
```

Be sure to replace `myprinter.local` with the host you're trying to connect to.

If neither of the above url examples work, then moonraker is incorrectly configured
on your printer.

If they do return a valid response, but fluidd still won't allow you to save,
then refer to the above configuration example to ensure moonraker is configured
to accept connections from your fluidd host.
