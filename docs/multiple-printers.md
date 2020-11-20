# Multiple Printers

Fluidd allows connecting and swapping between multiple printers.

In some circumstances, moonraker must be configured to allow a connection from fluidd. Configuration may depend on your type of install.

In the `moonraker.conf` file is a section called `cors_domains:`. The host name (in your browser URL) must be in this list for a successful connection to be made. Normally, this file has sane defaults - but often users change their host name or have other unique network configurations that require changes.

For example, if your printer hostname is `prusa` - then you would add a line to the `cors_domains` heading as follows;
```
http://prusa
```

Other examples might be;

`192.168.1.50` -> `http://192.168.1.50`.

`ultimaker` -> `http://ultimaker`.

Here's a full example of a moonraker configuration with the above applied;

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
  http://192.168.1.50
  http://ultimaker
  http://prusa
trusted_clients:
 10.0.0.0/8
 127.0.0.0/8
 169.254.0.0/16
 172.16.0.0/16
 192.168.0.0/16
 FE80::/10
 ::1/128
```
