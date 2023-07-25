---
layout: default
title: Spool Management
parent: Features
nav_order: 17
permalink: /features/spoolman
---

# Spool Management
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Fluidd offers support for the [Spoolman](https://github.com/Donkie/Spoolman) filament spool manager.

### Print start
On print start, Fluidd will show a modal asking you to select the spool you want to use for printing.
The modal shows all available (i.e. not archived) spools.
A spool can either be selected by selecting it directly, or by scanning an associated QR code using an attached webcam.

Fluidd currently supports the following QR code contents:
- `<spoolman url>/spool/show/<spool id>`, e.g. `http://spoolman.local/spool/show/123`

![screenshot](/assets/images/spoolman-scan-spool.png)

### Selecting a different spool
If you need to select another spool during your print (e.g. when your current spool has run out, or you have a multicolor print),
you can do so in the "Tools" dropdown within the "Tool" panel:
![screenshot](/assets/images/spoolman-change-spool.png)

### Sanity checks
When starting a print or changing spools, Fluidd will automatically perform these sanity checks and warn you if they fail:  
1) a spool is selected  
2) the selected spool has enough filament left on it to finish the print job  
3) the selected spool's filament type matches the one selected in the slicer  
