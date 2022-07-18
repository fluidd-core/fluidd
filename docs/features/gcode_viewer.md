---
layout: default
title: Gcode Viewer
parent: Features
nav_order: 15
permalink: /features/gcode-viewer
---

# Gcode Viewer
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

### Gcode Viewer
Fluidd's Gcode viewer provides a 2D-visualization of the currently selected layer.
It can automatically follow the print progress and provide you with information about
the currently executed moves. The most commonly accessed settings are accessible via
the cog icon in the cards header and allow you to customize the preview's behavior.

![screenshot](/assets/images/gcode_preview.png)

### Exclude Object
The Gcode viewer has [Exclude Object](https://www.klipper3d.org/Exclude_Object.html#exclude-objects) support built-in. To exclude an object from your
current print, for example in the case of a print failure, simply click on the cancel
icon within the Gcode preview, or bring up a list of all objects by clicking the cancel
icon in the header of the card.  
Excluded objects will be marked in red, the currently printing object in blue, and all
other objects in green.

For this feature to work you need to:
- Turn on `Label Objects` in your slicer.
- Add an `[exclude_object]` section to your printer.cfg or fluidd.cfg file.
- Add a a line `enable_object_processing: True` to your mooraker.conf `[file_manager]` section.
  Alternatively you can configure [object preprocessing for your slicer](https://github.com/kageurufu/preprocess_cancellation).

This feature only works on files that were uploaded _after_ these configuration changes as the file needs to be processed by mooraker with this option turned on.

![screenshot](/assets/images/exclude_object.png)
![screenshot](/assets/images/exclude_object_modal.png)

### Settings
As mentioned in [Gcode Viewer](#gcode-viewer-1), the Gcode preview can be customized.  
Frequently changed options can be found under the cog icon in the card header for
faster access, while less commonly used options can be found on Fluidd's settings page.  
![screenshot](/assets/images/gcode_display_opts.png)
![screenshot](/assets/images/gcode_settings.png)

