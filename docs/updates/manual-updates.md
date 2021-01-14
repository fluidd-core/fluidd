# Manual Updates

On an already configured system, you can manually update as follows;

## Fluidd

```bash
# Update files
cd ~/fluidd
rm -R ./*
rm .version
wget -q -O fluidd.zip https://github.com/cadriel/fluidd/releases/latest/download/fluidd.zip
unzip fluidd.zip
rm fluidd.zip

# Restart services
sudo service nginx restart
```

## Moonraker

```bash
# Update files
cd ~/moonraker
git pull
```

Moonraker requires different update commands depending how long ago you last updated.

```bash
# Choose ONE of the following updates..

# Full re-install. Rebuilds virtual env + redefines location of configuration.
./scripts/install-moonraker.sh -r -f -c /home/pi/klipper_config/moonraker.conf

# Full re-instrall. Rebuilds virtual env.
./scripts/install-moonraker.sh -r -f

# Regular update.
./scripts/install-moonraker.sh

# Finally, restart services.
sudo service moonraker restart
```

## Klipper

Note, this guide does not cover MCU updates should one be required after a klipper update.

```bash
cd ~/klipper
git pull
sudo service klipper restart
```

## Host

If you wish to restart your host;

```bash
# To reboot your host.
sudo reboot
```
