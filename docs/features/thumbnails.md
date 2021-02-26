---
layout: default
title: Thumbnails
parent: Features
nav_order: 1
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

![screenshot](/assets/images/thumbnails.png)
