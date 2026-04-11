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

![Thermal graph showing real-time temperature history for heaters and sensors](/assets/images/graph.png)

## Presets

Fluidd supports custom thermal presets — saved temperature profiles you can
apply with one click. Configure your presets in the UI Settings page.

![Temperature preset configuration with preset name and target temperature fields](/assets/images/presets.png)

!!! tip "Turning heaters off"
    Set a temperature to `0` in a preset to turn that heater off.

Presets can also store fan speeds. Add a fan speed to a preset for materials
that need active cooling (e.g., PLA) or none at all (e.g., ABS).

## Sensors

Fluidd displays any temperature sensor that Klipper exposes. Below are the
two most common built-in sensor types.

### Host temperature (Raspberry Pi)

See the [Klipper `temperature_host` reference](https://www.klipper3d.org/Config_Reference.html#temperature_host).

```ini title="printer.cfg"
[temperature_sensor raspberry_pi]
sensor_type: temperature_host
min_temp: 10
max_temp: 100
```

### MCU temperature (ATSAM, ATAMD, STM32)

See the [Klipper `temperature_mcu` reference](https://www.klipper3d.org/Config_Reference.html#temperature_mcu).

```ini title="printer.cfg"
[temperature_sensor mcu_temp]
sensor_type: temperature_mcu
min_temp: 0
max_temp: 100
```

### Environmental sensors

Klipper supports a wide range of I2C temperature, humidity, and pressure
sensors — including AHT10/20/30, BME280/680, BMP180/388, SHT3X, HTU21D,
LM75, and more. Fluidd displays these automatically when configured. For
setup details, refer to the
[Klipper temperature sensor documentation](https://www.klipper3d.org/Config_Reference.html#temperature-sensors).

### MPC (Kalico)

If you are running [Kalico](/features/third-party-integrations#kalico-firmware) with MPC
(Model Predictive Control) configured for your extruder, Fluidd shows an
`MPC_CALIBRATE` button in the thermals card.

## Troubleshooting

### Sensor not appearing in the chart or on the dashboard

- Verify the sensor is configured in `printer.cfg` and that Klipper restarted
  without errors after the change.
- Check that the sensor type string is spelled correctly and is supported by
  your version of Klipper — see the
  [Klipper temperature sensor documentation](https://www.klipper3d.org/Config_Reference.html#temperature-sensors).
- Host and MCU temperature sensors require the correct `sensor_type` value
  (`temperature_host` or `temperature_mcu`). See the examples in the
  [Sensors](#sensors) section above.

### Temperature history is short or missing

Moonraker stores a rolling temperature history buffer. If the chart shows
only a few seconds of history, check the `temperature_store_size` value in
the `[data_store]` section of your `moonraker.conf`. The default is 1200
samples (20 minutes at one sample per second). See the
[Moonraker data_store documentation](https://moonraker.readthedocs.io/en/latest/configuration/#data_store)
for details.
