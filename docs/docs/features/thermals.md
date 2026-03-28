---
title: Thermals
---

# Thermals

Fluidd displays real-time temperature data for all heaters, fans, and sensors
configured in Klipper.

## Chart

Fluidd's thermals chart shows temperatures and power applied to heaters and
fans in real time.

- Click a heater, sensor, or fan name to toggle its visibility.
- Click the power value to toggle power graph visibility.
- Hold ++shift++ and scroll the mouse wheel over the chart to zoom.

![screenshot](/assets/images/graph.png)

## Presets

Fluidd supports custom thermal presets — saved temperature profiles you can
apply with one click. Configure your presets in the UI Settings page.

![screenshot](/assets/images/presets.png)

## Sensors

Fluidd displays any temperature sensor that Klipper exposes. Below are some
common configuration examples.

### Host temperature (Raspberry Pi)

```ini title="printer.cfg"
[temperature_sensor raspberry_pi]
sensor_type: temperature_host
min_temp: 10
max_temp: 100
```

### MCU temperature (ATSAM, ATAMD, STM32)

```ini title="printer.cfg"
[temperature_sensor mcu_temp]
sensor_type: temperature_mcu
min_temp: 0
max_temp: 100
```

### AHT10 / AHT20 / AHT30 (temperature and humidity)

```ini title="printer.cfg"
[temperature_sensor enclosure]
sensor_type: AHT10
i2c_mcu: mcu
i2c_bus: i2c1
```

### BMP180 / BMP280 / BMP388 (pressure and temperature)

```ini title="printer.cfg"
[temperature_sensor chamber_pressure]
sensor_type: BMP388
i2c_mcu: mcu
i2c_bus: i2c1
```

### SHT3x (temperature and humidity)

```ini title="printer.cfg"
[temperature_sensor enclosure_sht]
sensor_type: SHT3X
i2c_mcu: mcu
i2c_bus: i2c1
```

### Other sensors

Klipper 0.13.0 added support for additional sensor types including load cells
(ldc1612) and hall angle sensors (mt6816/mt6826s). For a full list, refer to
the
[Klipper documentation](https://www.klipper3d.org/Config_Reference.html#temperature-sensors).
