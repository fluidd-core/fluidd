---
title: Configuration
icon: lucide/settings
---

# Configuration

Because Fluidd relies on Moonraker and Klipper, configuration needs to happen
in more than one location. Start with the initial setup section to ensure you
have the basic requirements in place first.

## Initial Setup

Fluidd requires some basic configuration to be applied in order to function
correctly. Fluidd should warn you if these are not found in your configuration
upon startup.

## Fluidd Config (recommended)

The easiest way to set up Klipper for Fluidd is to use
[fluidd-config](https://github.com/fluidd-core/fluidd-config) — a maintained
set of base macros and settings provided by the Fluidd team. It includes all
required Klipper sections and enhanced macros in a single include file.

### Installation

If you installed Fluidd via [KIAUH](/getting-started#kiauh), you can install
fluidd-config directly from the KIAUH menu — no manual cloning needed.

For manual installations, clone the repository and create a symlink:

```bash
cd ~/printer_data/config
git clone https://github.com/fluidd-core/fluidd-config.git
ln -sf fluidd-config/fluidd.cfg fluidd.cfg
```

Then add the following to your `printer.cfg`:

```ini title="printer.cfg"
[include fluidd.cfg]
```

And add this to your `moonraker.conf` to receive automatic updates:

```ini title="moonraker.conf"
[update_manager fluidd-config]
type: git_repo
primary_branch: master
path: ~/printer_data/config/fluidd-config
origin: https://github.com/fluidd-core/fluidd-config.git
managed_services: klipper
```

### Features

Fluidd-config provides enhanced versions of the standard macros with additional
capabilities:

- Configurable park positions (round beds, square beds, or custom coordinates)
- Enhanced PAUSE macro with optional X, Y, and Z_MIN parameters
- Pause at next layer or at a specific layer number
- Temperature management during pause/resume cycles
- Filament runout sensor integration
- Configurable idle timeout behavior
- Support for printers without extruders (e.g. CNC machines)

### Customization

You can customize the behavior by overriding the `_CLIENT_VARIABLE` macro in
your `printer.cfg`. This lets you adjust retraction distances, movement speeds,
park positions, and hook in your own custom macros. See the
[fluidd-config documentation](https://github.com/fluidd-core/fluidd-config)
for all available options.

## Klipper (manual configuration)

If you prefer to configure Klipper manually instead of using fluidd-config,
the following sections must be present in your `printer.cfg` for Fluidd to
function correctly.

For more detailed instructions, please refer to the [Klipper documentation](https://www.klipper3d.org/Config_Reference.html).

### [virtual_sdcard]

Fluidd requires your printer to be set up with `virtual_sdcard`. This allows
file uploads to work correctly. If you get a G-code path not found error in
Fluidd, this is generally the first place to look.

```ini title="printer.cfg"
[virtual_sdcard]
path: ~/printer_data/gcodes
```

### [display_status]

Required to properly support display updates in Fluidd, with no other lines required.

```ini title="printer.cfg"
[display_status]
```

### [pause_resume]

Enables Pause / Resume functionality within klipper. This is a single block, with no other lines required.

```ini title="printer.cfg"
[pause_resume]
```

### Macros

Klipper provides built-in `PAUSE`, `RESUME`, and `CANCEL_PRINT` commands when
`[pause_resume]` is enabled. The macros below are **optional** — they override
the built-ins to add park positioning and extrusion retract on pause. Adapt
them to your printer or use
[fluidd-config](#fluidd-config-recommended) for a more complete version.

#### PAUSE

```ini title="printer.cfg"
[gcode_macro PAUSE]
description: Pause the actual running print
rename_existing: PAUSE_BASE
# change this if you need more or less extrusion
variable_extrude: 1.0
gcode:
  ##### read E from pause macro #####
  {% set E = printer["gcode_macro PAUSE"].extrude|float %}
  ##### set park position for x and y #####
  # default is your max position from your printer.cfg
  {% set x_park = printer.toolhead.axis_maximum.x|float - 5.0 %}
  {% set y_park = printer.toolhead.axis_maximum.y|float - 5.0 %}
  ##### calculate save lift position #####
  {% set max_z = printer.toolhead.axis_maximum.z|float %}
  {% set act_z = printer.toolhead.position.z|float %}
  {% if act_z < (max_z - 2.0) %}
      {% set z_safe = 2.0 %}
  {% else %}
      {% set z_safe = max_z - act_z %}
  {% endif %}
  ##### end of definitions #####
  PAUSE_BASE
  G91
  {% if printer.extruder.can_extrude|lower == 'true' %}
    G1 E-{E} F2100
  {% else %}
    {action_respond_info("Extruder not hot enough")}
  {% endif %}
  {% if "xyz" in printer.toolhead.homed_axes %}
    G1 Z{z_safe} F900
    G90
    G1 X{x_park} Y{y_park} F6000
  {% else %}
    {action_respond_info("Printer not homed")}
  {% endif %}
```

#### RESUME

```ini title="printer.cfg"
[gcode_macro RESUME]
description: Resume the actual running print
rename_existing: RESUME_BASE
gcode:
  ##### read E from pause macro #####
  {% set E = printer["gcode_macro PAUSE"].extrude|float %}
  #### get VELOCITY parameter if specified ####
  {% if 'VELOCITY' in params|upper %}
    {% set get_params = ('VELOCITY=' + params.VELOCITY)  %}
  {%else %}
    {% set get_params = "" %}
  {% endif %}
  ##### end of definitions #####
  {% if printer.extruder.can_extrude|lower == 'true' %}
    G91
    G1 E{E} F2100
  {% else %}
    {action_respond_info("Extruder not hot enough")}
  {% endif %}
  RESUME_BASE {get_params}
```

#### CANCEL_PRINT

```ini title="printer.cfg"
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
cases, you shouldn't need to touch anything here. If Klipper's Unix socket
is at a non-standard path, set `klippy_uds_address` accordingly.

### [file_manager]

If you want to be able to cancel single objects on a multi-object print, then
you will need to set `enable_object_processing: True` here to enable it.

```ini title="moonraker.conf"
[file_manager]
enable_object_processing: True
```

### [data_store]

Temperature and G-code store sizes can be configured in moonraker.
This is especially useful for temperature store data, as it
directly affects how much time data is stored on the X axes of
the thermals graph.

Temperature store size is in seconds, while the G-code store size is defined
in an entry count.

```ini title="moonraker.conf"
[data_store]
temperature_store_size: 600
gcode_store_size: 1000
```

### [authorization]

This configures the authorization required to access the moonraker API.
Normally, this is enabled. Your installation method may provide a default
configuration that applies to most users network requirements, however -
sometimes changes are required to meet specific needs.

#### CORS Domains

CORS Domains are a list of host names that are allowed to communicate with
moonraker.

If your IP address falls under the trusted clients, moonraker should allow
your host to connect without changes.
However, if you're having trouble — or otherwise attempting
to connect from a unique location, you may need to add an entry into the `cors_domains`
block.

You can enter an address as a wildcard or full host. The
[configuration example](#example-configuration) provides configuration that should work
for most users.

Protocols are required, but can be omitted with the use of wildcards.

#### Trusted Clients

Trusted clients are a list of IP ranges that moonraker will accept communication
from. The default list in the [configuration example](#example-configuration) covers
most user configurations for internal networks. Note that these ranges are in CIDR
format.

### [history]

Enables job history. Also provides benefits such as being able to reprint
failed or cancelled prints, and sorting your filesystem by last print time.

See the [feature docs](/features/printing#print-history) for more explanation of these features.

### [octoprint_compat]

This enables the slicer upload feature, allowing PrusaSlicer, SuperSlicer and
Cura users to directly upload gcodes. This section must be explicitly included
in your `moonraker.conf` and Moonraker must be restarted for the module to
load. See the [configuration example](#example-configuration).

### [announcements]

Enables Moonraker announcements for Fluidd, so that any important Fluidd message
from the developers and maintainers is shown in the Fluidd notifications.

```ini title="moonraker.conf"
[announcements]
subscriptions:
  fluidd
```

### [update_manager]

Automated updates can be configured by ensuring the following is in your
`moonraker.conf`. Moonraker automatically refreshes update status approximately
every two hours. Update requests are blocked while a print is in progress.

```ini title="moonraker.conf"
[update_manager]

[update_manager fluidd]
type: web
repo: fluidd-core/fluidd
path: ~/fluidd
```

### Example Configuration

This is an example configuration which should apply to most users.
Your moonraker configuration can usually be found here: `~/printer_data/config/moonraker.conf`

```ini title="moonraker.conf"
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
[docker installation](/getting-started#docker) or
[KIAUH installation](/getting-started#kiauh);

1. Note the URL you use to access Fluidd
   - For this example, let's assume you access Fluidd on `http://fluidd.local`

2. On your fluidd host, when adding a new printer URL — add the full address
   to your printer E.g., `http://myprinter.local`.

3. If step #2 fails
   - Make sure moonraker is running, and accessible. You can try to directly test
     moonraker by going here; `http://myprinter.local/server/info`. If this URL
     works, and you still can't connect — please review the
     [Moonraker section](#cors-domains)

You can see an [example configuration](#example-configuration) that works for
`https://app.fluidd.xyz` along with many common network setups.

### Troubleshooting

If you're entering a printer URL into the add printer dialog but Fluidd won't let you save:

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
