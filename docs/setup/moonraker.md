# Moonraker Configuration

Moonraker is the API that fluidd communicates with, which in turn communicates with Klipper.
All three components are required for a healthy printer.

For more detailed instructions, please refer to [Arksine's documentation](https://github.com/Arksine/moonraker/blob/master/docs/installation.md).

## Trusted Clients

Trusted clients are a list of ip ranges that moonraker will accept communcation from.
The default list in the configuration below covers most user configurations for internal networks.
Note these ranges are in CIDR format.

## Cors Domains

Cors Domains are a list of host names that are allowed to communicate with moonraker. Generally speaking,
the address you type into your browsers URL bar to communicate with Fluidd, should also exist in moonraker.
You can enter an address as a wildcard or full host.

Protocols are required. See the configuration below for more examples.

If you access your printer by ip address, or on an otherwise non-standard port - you may need to add that address into your configuration.

As an example, if you open fluidd in your browser from here `192.168.1.2:8080` then you'd need this line under `cors_domains:`

```ini
cors_domains:
  http://192.168.1.2:8080
```


## Example Configuration

This is a solid example configuration, which should apply to most users.
Your moonraker configuration can usually be found here: `~/klipper_config/moonraker.conf`

```ini
[server]
host: 0.0.0.0
port: 7125
enable_debug_logging: True
config_path: ~/klipper_config

[authorization]
enabled: True
cors_domains:
  http://*.local
  https://*.local
  http://*.lan
  https://*.lan
  http://app.fluidd.xyz
  https://app.fluidd.xyz
trusted_clients:
  10.0.0.0/8
  127.0.0.0/8
  169.254.0.0/16
  172.16.0.0/12
  192.168.0.0/16
  FE80::/10
  ::1/128

[update_manager]
client_repo: cadriel/fluidd
client_path: /home/pi/fluidd
```
