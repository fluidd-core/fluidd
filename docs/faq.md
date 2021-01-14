# FAQ

- The host reboot / shutdown commands don't work!
  
  Try jumping into `ssh` and running the following;

  ```bash
  ./moonraker/scripts/sudo-fix.sh
  ```

- My WiFi keeps dropping, is there anything I can do?

  Depending on your network configuration, sometimes the low power mode of the Pi's network adapter
  can cause issues. You can try fixing this by editing the `/etc/rc.local` file and adding the following
  to the bottom;

  ```sh
  iwconfig wlan0 power off
  ```

  Then rebooting.
  
- I have high CPU usage!

  The temperature graph has heavy usage. Try contracting its panel, or disable it in layout mode.
  Investigation of other options here is underway.

- Why can't I see a total layer count in Fluidd?

  Klipper and Moonraker would need to expose this data to Fluidd in order for it to reliably present this
  information. Once this happens - Fluidd will show it.