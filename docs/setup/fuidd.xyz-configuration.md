# fluidd.xyz configuration

Have mainsail installed, or don't want to install Fluidd locally? We support that!

Fluidd is hosted at http://app.fluidd.xyz - and is downloaded to your browser. It has no interaction outside of your network unless configured to do so.

In order to allow fluidd to connect to your printer, you'll need to configure Moonraker.

In the `moonraker.conf` file is a section called `cors_domains:`. The fluidd.xyz host must be in this section for a successful connection to be made.

You can generally find the moonraker.conf file here `~/klipper_configuration/moonraker.conf` for Fluiddpi and Mainsail installs.

An example `moonraker.conf` would be;

```
[server]
host: 0.0.0.0
port: 7125
enable_debug_logging: True
config_path: ~/klipper_config

[authorization]
enabled: True
cors_domains:
  http://*.local
  http://app.fluidd.xyz
  https://app.fluidd.xyz
trusted_clients:
 10.0.0.0/8
 127.0.0.0/8
 169.254.0.0/16
 172.16.0.0/16
 192.168.0.0/16
 FE80::/10
 ::1/128
```

Specifically, the two app.fluidd.xyz entries should be added to the `cors_domains` section of `moonraker.conf`
