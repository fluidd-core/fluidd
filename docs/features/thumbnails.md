---
layout: default
title: Thumbnails
parent: Features
nav_order: 3
permalink: /features/thumbnails
---

# Thumbnails
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Both PrusaSlicer and SuperSlicer allow configuration of thumbnails to be generated alongside your `gcode`. Each slicer has a slightly different configuration.

Cura requires either installing and using the OctoPrint Connection plugin (recommended) or configuring a post processing script to create the thumbnails.  

Fluidd's recommended thumbnails should be the following sizes;

```bash
300x300 - For the larger previews.
48x48   - For the smaller file thumbs.
```

### PrusaSlicer

Running PrusaSlicer `2.3.0+`?

- With PrusaSlicer open, navigate to `Printer Settings`.
- On the `General` tab, under the heading `Firmware` find the `G-code thumbnails` option.
- Enter `48x48,300x300`

Running PrusaSlicer `2.2.0` or below?

- With PrusaSlicer open, click `Help -> Show Configuration Folder`.
- Now close PrusaSlicer.
- With the now open file navigator, Navigate to the `printer` folder, and open the appropriate printer profile.
- Find the line labelled `thumbnails` and update to the following;

```bash
thumbnails = 48x48, 300x300
```

- Now, restart PrusaSlicer, slice a file - and take a look at it in Fluidd!

### SuperSlicer

- With SuperSlicer open, navigate to `Printer Settings`.
- Find the `General` tab, under the heading `Thumbnails`.
- In the `Small` section add `x: 48, y: 48`, and in the `Large` section add `x: 300, y: 300`
- The Color override and Bed on Thumbnail options are personal preference, but having the Bed on Thumbnail option unticked looks the best!
- Now, restart SuperSlicer, slice a file - and take a look at it in Fluidd!

### Cura with OctoPrint plugin (recommended)

- Enable [Slicer Uploads](/features/slicer-uploads)
- Follow the instructions to [install and use](https://github.com/fieldOfView/Cura-OctoPrintPlugin#installation) the OctoPrint Connection plugin in Cura.
- After installing the plugin and restarting Cura, slice a file, click `Print with OctoPrint` button - and take a look at it in Fluidd!

### Cura with post processing script

- With Cura open, navigate to `Extensions`, `Post Processing`, `Modify G-Code`
- Click `Add a script`, and select `Create Thumbnail`
- Set both `Width` and `Height` to `300`
- Click `Add a script`, and select `Create Thumbnail`
- Set both `Width` and `Height` to `48`
- Click `Close`
- Now slice a file - and take a look at it in Fluidd!

![screenshot](/assets/images/thumbnails.png)
