---
title: Configuration
icon: lucide/settings
---

# Configuration

Because Fluidd relies on Moonraker and Klipper, configuration needs to happen
in more than one location.

!!! tip "Installed via KIAUH or another automated tool?"
    Check whether your `printer.cfg` already has `[include fluidd.cfg]`. If
    it does, [fluidd-config](#fluidd-config-recommended) is installed and you
    are ready to print — no further configuration is required.

    For manual or custom installations, follow the sections below in order:

    1. **[Fluidd Config](#fluidd-config-recommended)** — recommended; installs
       all required config in one step
    2. **[Klipper](#klipper-manual-configuration)** — required sections if you
       are not using fluidd-config
    3. **[Moonraker](#moonraker)** — API configuration
    4. Refer to [Common Configuration Issues](#common-configuration-issues)
       if Fluidd shows warnings or won't connect

## Initial Setup

Fluidd requires some basic configuration to be applied in order to function
correctly. Fluidd will warn you on startup if required sections are missing.

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
- Separate park positions for `PAUSE` and `CANCEL_PRINT`
- Enhanced `PAUSE` macro with optional X, Y, and Z_MIN parameters
- Pause at next layer or at a specific layer number
- Temperature management during pause/resume cycles (save/restore extruder
  temperature with idle timeout integration)
- Configurable retraction and unretraction with firmware retraction support
- Filament runout sensor integration (blocks `RESUME` if no filament detected)
- Configurable idle timeout behavior during `PAUSE` state
- User-injectable custom macros in `PAUSE`/`RESUME`/`CANCEL_PRINT` flows
- Safer toolhead movement commands via `_CLIENT_LINEAR_MOVE`
- Support for printers without extruders (e.g. CNC machines)

### Fluidd UI Integration

When fluidd-config is installed, Fluidd automatically detects its macros and
enables additional UI features:

- **Pause at layer** — the `SET_PAUSE_NEXT_LAYER` and `SET_PAUSE_AT_LAYER`
  macros enable a pause-at-layer dropdown in the print controls, allowing you
  to pause or trigger an `M600` filament change at a specific layer
- **Toolhead park button** — the `PARK_TOOLHEAD` macro adds a park button to
  the toolhead card
- **Filament load/unload buttons** — the `LOAD_FILAMENT` and `UNLOAD_FILAMENT`
  macros add dedicated buttons to the toolhead card

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

Fluidd requires `virtual_sdcard` to upload, browse, and print G-code files.
Without this, Fluidd cannot manage files on your printer.
See the [Klipper `[virtual_sdcard]` reference](https://www.klipper3d.org/Config_Reference.html#virtual_sdcard).

!!! warning "G-code path not found"
    If you get a G-code path not found error in Fluidd, check that
    `[virtual_sdcard]` is configured correctly — this is the most common
    cause.

```ini title="printer.cfg"
[virtual_sdcard]
path: ~/printer_data/gcodes
```

### [display_status]

Required for Fluidd to show print progress percentages and M117 display
messages. No additional configuration is needed.
See the [Klipper `[display_status]` reference](https://www.klipper3d.org/Config_Reference.html#display_status).

```ini title="printer.cfg"
[display_status]
```

### [pause_resume]

Enables the Pause, Resume, and Cancel buttons in Fluidd's print controls.
Without this, Fluidd cannot pause or cancel a running print. No additional
configuration is needed.
See the [Klipper `[pause_resume]` reference](https://www.klipper3d.org/Config_Reference.html#pause_resume).

```ini title="printer.cfg"
[pause_resume]
```

### Macros

Klipper provides built-in `PAUSE`, `RESUME`, and `CANCEL_PRINT` commands when
`[pause_resume]` is enabled.

!!! note "Optional macros"
    The macros below are **optional** — they override the built-ins to add
    park positioning and extrusion retract on pause. If you use
    [fluidd-config](#fluidd-config-recommended), these are already included
    with additional features.

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

Moonraker is the API that Fluidd communicates with, which in turn communicates
with Klipper. All three components are required for a healthy printer.

For the full configuration reference, see the
[Moonraker documentation](https://moonraker.readthedocs.io/en/latest/configuration/).

### [server]

Configures the Moonraker server. In most cases the defaults are fine — only
set `klippy_uds_address` if Klipper's Unix socket is at a non-standard path.
See the [Moonraker `[server]` reference](https://moonraker.readthedocs.io/en/latest/configuration/#server).

### [file_manager]

To cancel individual objects during a multi-object print, enable object
preprocessing here.
See the [Moonraker `[file_manager]` reference](https://moonraker.readthedocs.io/en/latest/configuration/#file_manager).

```ini title="moonraker.conf"
[file_manager]
enable_object_processing: True
```

### [data_store]

Controls how much history Moonraker buffers in memory. The
`temperature_store_size` value directly affects how much time is shown on
the X axis of the [thermals graph](/features/thermals#chart). Temperature
entries are stored once per second, so `600` equals approximately 10 minutes.
See the [Moonraker `[data_store]` reference](https://moonraker.readthedocs.io/en/latest/configuration/#data_store).

```ini title="moonraker.conf"
[data_store]
temperature_store_size: 600
gcode_store_size: 1000
```

### [authorization]

Controls which clients can access the Moonraker API. An automated installer
typically provides a default that works for most home networks — adjustments
are occasionally needed for remote access or unusual network topologies.
See the [Moonraker `[authorization]` reference](https://moonraker.readthedocs.io/en/latest/configuration/#authorization).

#### CORS Domains

A list of hostnames that Moonraker accepts cross-origin requests from.

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

Trusted clients are a list of IP ranges that Moonraker will accept communication
from. The default list in the [configuration example](#example-configuration) covers
most user configurations for internal networks. Note that these ranges are in CIDR
format.

### [history]

Enables job history, reprinting failed or cancelled prints, and sorting the
file browser by last print time.
See the [feature docs](/features/printing#print-history) for more details, and the
[Moonraker `[history]` reference](https://moonraker.readthedocs.io/en/latest/configuration/#history).

!!! tip "Backup & Restore"
    You can back up and restore the Moonraker database from the
    [System page](/features/system-and-notifications). This preserves Fluidd settings, print
    history, and other Moonraker data.

### [octoprint_compat]

Enables the slicer upload feature, allowing PrusaSlicer, SuperSlicer, and
Cura users to upload G-code files directly. This section must be explicitly
included in your `moonraker.conf` and Moonraker must be restarted for the
module to load. See the [slicer uploads feature docs](/features/slicer-uploads)
and the [configuration example](#example-configuration).

### [announcements]

Enables Moonraker announcements for Fluidd, so that important messages from
the developers and maintainers are shown in the Fluidd notifications panel.
See the [Moonraker `[announcements]` reference](https://moonraker.readthedocs.io/en/latest/configuration/#announcements).

```ini title="moonraker.conf"
[announcements]
subscriptions:
  fluidd
```

### [analysis]

Enables G-code print time estimation using Moonraker's built-in estimator.
When enabled, Fluidd shows a "Perform Time Analysis" action in the file
browser — available for single files via context menu or in bulk. Results are
stored in file metadata and update the estimated print time displayed in the
file list.
See the [Moonraker `[analysis]` reference](https://moonraker.readthedocs.io/en/latest/configuration/#analysis).

### [job_queue]

Enables the job queue feature. When enabled, Fluidd shows a job queue card on
the dashboard, a queue tab on the Jobs page, and "Add to queue" actions in the
file browser context menu and bulk actions toolbar.
See the [job queue feature docs](/features/job-queue) and the
[Moonraker `[job_queue]` reference](https://moonraker.readthedocs.io/en/latest/configuration/#job_queue).

### [update_manager]

Enables automated updates for Klipper, Moonraker, Fluidd, and any extra
components you configure. Update requests are blocked while a print is in
progress. See the
[Moonraker `[update_manager]` reference](https://moonraker.readthedocs.io/en/latest/configuration/#update_manager)
for advanced options such as custom repositories and pinned branches.

```ini title="moonraker.conf"
[update_manager]

[update_manager fluidd]
type: web
repo: fluidd-core/fluidd
path: ~/fluidd
```

### Example Configuration

This is an example `moonraker.conf` that works for most home network setups.
Your Moonraker configuration file is usually at `~/printer_data/config/moonraker.conf`.

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

[analysis]

[job_queue]

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

## Common Configuration Issues

### Fluidd shows a configuration warning

Fluidd checks for required sections in `printer.cfg` and warns if any are
missing. Common warnings include:

- `[virtual_sdcard] not found in printer configuration.`
- `[pause_resume] not found in printer configuration.`
- `CANCEL_PRINT macro not found in configuration.`

Ensure `[virtual_sdcard]`, `[pause_resume]`, `[display_status]`, and a
`CANCEL_PRINT` macro are present. See the configuration examples above.

### Configuration changes are not saved

If the file editor shows a "Read only" error, check that Moonraker has
`enable_config_write_access: True` in `[file_manager]` (the default).
Also verify file system permissions on the config directory.

### CORS errors in the browser console

Your browser is blocking cross-origin requests. Add your Fluidd URL to
`cors_domains` in `moonraker.conf`. See [CORS Domains](#cors-domains) above
and the [example configuration](#example-configuration).
