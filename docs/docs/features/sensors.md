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

## BMP180, BMP280 and BMP388 pressure and temperature sensors

```ini
[temperature_sensor chamber_pressure]
sensor_type: BMP388
i2c_mcu: mcu
i2c_bus: i2c1
```

## SHT3x temperature and humidity sensors

```ini
[temperature_sensor enclosure_sht]
sensor_type: SHT3X
i2c_mcu: mcu
i2c_bus: i2c1
```

## Other sensors

Fluidd will display any temperature sensor that Klipper exposes. Klipper 0.13.0
added support for additional sensor types including load cells (ldc1612) and
hall angle sensors (mt6816/mt6826s). For a full list, refer to the
[Klipper documentation](https://www.klipper3d.org/Config_Reference.html#temperature-sensors).
