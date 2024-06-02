---
layout: default
title: Hide macros, output pins, fans and sensors
parent: Customize
nav_order: 3
permalink: /customize/hide
---

# Hide macros, output pins, fans and sensors
{: .no_toc }

---

Fluidd allows you to hide macros, output pins, fans and sensors by prefixing
them with an underscore (`_`).

By doing this - you're removing them from Fluidd. This can be handy in
situations where you have a large quantiy of macros, or whereby you have an
output pin you may have no need to control in UI.

Some examples;

```yaml
[gcode_macro _MY_MACRO]
gcode:
  G28
```

```yaml
[output_pin _BEEPER]
pin: z:P1.30
```

```yaml
[temperature_sensor _MCU]
sensor_type: MCU
```

Macros can also be hidden directly from the Fluidd settings by toggling their
visibility, in order to not change their name:  
![screenshot](/assets/images/macro_visibility.png)
