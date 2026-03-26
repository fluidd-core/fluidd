---
title: Sensors
---

# Sensors

Fluidd supports many of the built-in sensors from Klipper. Some examples are;

## Raspberry Pi Temperature

```ini
[temperature_sensor raspberry_pi]
sensor_type: temperature_host
min_temp: 10
max_temp: 100
```

## ATSAM, ATAMD and STM32 temperature sensors

```ini
[temperature_sensor mcu_temp]
sensor_type: temperature_mcu
min_temp: 0
max_temp: 100
```

## AHT10, AHT20 and AHT30 temperature and humidity sensors

```ini
[temperature_sensor enclosure]
sensor_type: AHT10
i2c_mcu: mcu
i2c_bus: i2c1
```

## Other sensors

Fluidd will display any temperature sensor that Klipper exposes. For a full
list of supported sensor types, refer to the
[Klipper documentation](https://www.klipper3d.org/Config_Reference.html#temperature-sensors).
