---
layout: default
title: Slicer Uploads
parent: Features
nav_order: 2
permalink: /features/slicer-uploads
---

# Slicer Uploads
{: .no_toc }

---

You can upload your sliced `gcode` from within PrusaSlicer or SuperSlicer. 

- With PrusaSlicer / SuperSlicer open, click the "cog" icon right of the Printer profiles combo box and select `Add physical printer`
- Type a descriptive printer name
- choose proper printer preset
- Ensure the type is set to `OctoPrint`
- The `hostname, IP or URL` is your printer URL. Typically this would be `fluidd.local` or similar (you may also need to add moonraker port, ie 7125 in some cases.)
- Enter some random characters in the API field.
- Click test!

![screenshot](/assets/images/physical-printer.png)
![screenshot](/assets/images/slicer-upload.png)
