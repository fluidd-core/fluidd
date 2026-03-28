---
title: Customize
icon: lucide/palette
---

# Customize

Fluidd allows you to adjust the layout of your dashboard, set a theme color,
and control which components are visible.

## Application Layout

Fluidd allows you to adjust your dashboard layout to your liking. Use the
hamburger menu and click the `adjust layout` option.

Use the drag handles to move cards to / from the left and right columns. You
can also easily disable cards if you have no use for them.

Once you're done, click the exit layout mode button. You can reset back to
the default layout by clicking reset layout.

![screenshot](/assets/images/layout.png)

## Themes

### Theme Presets

Fluidd lets you choose a community preset, apply a color of your
choosing — along with either a dark or light theme.

Community presets are a way for Fluidd to support 3D printing communities. If
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

## Hiding Components

Fluidd allows you to hide macros, output pins, fans and sensors by prefixing
them with an underscore (`_`).

By doing this — you're removing them from Fluidd. This can be handy in
situations where you have a large quantity of macros, or whereby you have an
output pin you may have no need to control in UI.

Some examples;

```ini title="printer.cfg"
[gcode_macro _MY_MACRO]
gcode:
  G28
```

```ini title="printer.cfg"
[output_pin _BEEPER]
pin: z:P1.30
```

```ini title="printer.cfg"
[temperature_sensor _MCU]
sensor_type: MCU
```

Macros can also be hidden directly from the Fluidd settings by toggling their
visibility, in order to not change their name:

![screenshot](/assets/images/macro_visibility.png)
