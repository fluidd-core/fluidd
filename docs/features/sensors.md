---
layout: default
title: Sensors
parent: Features
nav_order: 5
permalink: /features/sensors
---

# Sensors
{: .no_toc }

---

Fluidd supports many of the built-in sensors from Klipper. Some examples are;

## Raspberry Pi Temperature

```yaml
[temperature_sensor raspberry_pi]
sensor_type: temperature_host
min_temp: 10
max_temp: 100
```

## ATSAM, ATAMD and STM32 temperature sensors

```yaml
[temperature_sensor mcu_temp]
sensor_type: temperature_mcu
min_temp: 0
max_temp: 100
```

More information concerning other supported sensors can be found in the
[klipper documentation](http://klipper3d.org)
