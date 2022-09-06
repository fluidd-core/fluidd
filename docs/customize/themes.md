---
layout: default
title: Themes
parent: Customize
nav_order: 2
permalink: /customize/themes
---

# Themes
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

### Theme Presets

Fluidd lets you choose a community preset, apply a color of your
choosing - along with either a dark or light theme.

Community presets are a way for Fluidd to support 3d printing communities. If
you'd like to see your logo supported here, let us know!

![screenshot](/assets/images/theme.png)

### Community Themes

Fluidd offers a way for custom stylesheets and background images to be included.
All custom theming is configured through a `.fluidd-theme` folder within your
configuration files.

#### Custom Background
To use a custom background, upload your `background.png` file into the
above-mentioned `.fluidd-theme` folder.
Currently, the following file extensions are supported:
- `.jpg`
- `.jpeg`
- `.png`
- `.gif`

#### Custom Styling
Fluidd offers a [curated list of community themes](https://github.com/fluidd-core/themes).  
To use a community theme, simply upload the themes `custom.css` file to the
`.fluidd-theme` directory.
After a reload of Fluidd the changes should become visible.
