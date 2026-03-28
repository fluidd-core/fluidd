---
title: Printing
---

# Printing

Fluidd provides tools to preview, monitor, and manage your prints — from
G-code visualization to thumbnail previews and print history.

## G-code Viewer

Fluidd's G-code viewer provides a 2D visualization of the currently selected
layer. It can automatically follow print progress and show information about
the moves being executed. Multi-tool prints are supported, with each tool
shown in a distinct color.

Frequently used settings are accessible via the cog icon in the card header.
Less common options can be found on Fluidd's settings page.

![screenshot](/assets/images/gcode_preview.png)
![screenshot](/assets/images/gcode_display_opts.png)
![screenshot](/assets/images/gcode_settings.png)

### Exclude Object

The G-code viewer has
[Exclude Object](https://www.klipper3d.org/Exclude_Object.html#exclude-objects)
support built in. To exclude an object from your current print (for example
after a failure), click the cancel icon in the G-code preview or bring up a
list of all objects by clicking the cancel icon in the card header.

Excluded objects are marked in red, the currently printing object in blue,
and all other objects in green.

For this feature to work:

- Turn on `Label Objects` in your slicer.
- Add an `[exclude_object]` section to your `printer.cfg` or `fluidd.cfg`.
- Set `enable_object_processing: True` in the `[file_manager]` section of
  `moonraker.conf`. Alternatively, configure
  [object preprocessing in your slicer](https://github.com/kageurufu/preprocess_cancellation).

This only works on files uploaded _after_ enabling these settings — Moonraker
needs to process the file with object preprocessing turned on.

![screenshot](/assets/images/exclude_object.png)
![screenshot](/assets/images/exclude_object_modal.png)

## Thumbnails

Fluidd can display thumbnail previews of your print files. The recommended
sizes are:

- `300x300` — for large previews
- `48x48` — for file browser thumbnails

### PrusaSlicer (2.3.0+)

1. Open `Printer Settings` → `General` tab → `Firmware` section.
2. Set `G-code thumbnails` to `48x48/PNG, 300x300/PNG`.

### PrusaSlicer (2.2.0 and below)

1. Click `Help` → `Show Configuration Folder`, then close PrusaSlicer.
2. Open the `printer` folder and edit your printer profile.
3. Set `thumbnails = 48x48, 300x300`.
4. Restart PrusaSlicer.

### SuperSlicer

1. Open `Printer Settings` → `General` tab → `Thumbnails` section.
2. Set `Small` to `48x48` and `Large` to `300x300`.

### Cura

**OctoPrint plugin (recommended):** Enable
[slicer uploads](/features/slicer-uploads), then install the
[OctoPrint Connection plugin](https://github.com/fieldOfView/Cura-OctoPrintPlugin#installation).
Use the `Print with OctoPrint` button after slicing.

**Post-processing script:** Go to `Extensions` → `Post Processing` →
`Modify G-Code`. Add two `Create Thumbnail` scripts — one at `300x300` and
one at `48x48`.

![screenshot](/assets/images/thumbnails.png)

## Bed Mesh

Fluidd has a built-in bed mesh viewer. Navigate to the printer page and
calibrate a mesh to view it.

You need `[bed_mesh]` configured in Klipper for this option to appear.

![screenshot](/assets/images/bed_mesh.png)

## Print History

Fluidd integrates with Moonraker's print history component to give you
insights into past prints.

- **View and sort** — browse your print history chronologically, sorted by
  last print date.
- **Filter** — narrow the list to specific jobs or statuses.
- **Statistics** — track total print time and filament usage over time.
- **Re-print** — re-start failed or cancelled jobs directly from the history.

Fluidd loads the last 50 prints by default. The full history can hold up to
10,000 entries — a dedicated History page is available from the main navigation
for a full-screen view.

![screenshot](/assets/images/print_history.png)
![screenshot](/assets/images/print_stats.png)
![screenshot](/assets/images/reprint.png)
