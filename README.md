# Fluidd

Fluidd is a free and open-source Klipper web interface for managing your 3d printer.

## Printer release verification

The manual printer-zip workflow records the exact build commit and configured
cloud base URL in `build-info.json`, then verifies the local archive before
publishing and the downloaded release asset afterward. The verifier accounts
for every output named by Vite's manifest, including lazy chunks, and checks
discoverable PWA precache and worker references. The manifest is compressed in
ZIP metadata rather than shipped in the served tree. We cannot inspect the M1
nginx configuration from this repository, so this assumes MuonOS extracts only
ZIP file entries and ignores ZIP comments. Monaco editor workers, which
vite-plugin-monaco-editor writes to `monacoeditorwork/` outside the manifest,
are checked against the URLs it injects into `index.html`; if `index.html`
names none, the output reports them as unchecked. PWA precache entries and
`assets/` worker bundles that leave no discoverable URL are likewise reported
as unchecked.

The commit and `cloudBaseUrl` are reported by the build itself and are not
checked against compiled code. `config.json` is checked only for
`hosted: false`; its provenance is not independently proven.

![Fluidd](/docs/assets/images/preview_sliced.png "Fluidd")

## Features

- Responsive UI, supports desktop, tablets and mobile
- Customizable layouts. Move any panel where YOU want
- Built-in color themes
- Manage multiple printers from one Fluidd install
- [See our docs for more!](https://docs.fluidd.xyz)

## Support & Documentation

See our [Docs](https://docs.fluidd.xyz).
Join our [Discord!](https://discord.gg/GZ3D5tqfcF).

## How to use?

Fluidd can be easily installed via [KIAUH](https://github.com/dw-0/kiauh), along with Klipper, Moonraker, and all of the required dependencies.

Please see the [docs](https://docs.fluidd.xyz) for help with installation and configuration.

## Where to download?

You can download the latest release [here](https://github.com/fluidd-core/fluidd/releases/latest).

Older releases can be found [here](https://github.com/fluidd-core/fluidd/releases).

## Docker support

We have an [official docker image](https://github.com/fluidd-core/fluidd/pkgs/container/fluidd). This is updated for each release and on each commit.

## Official sponsors

[![LDO](/docs/assets/images/logo_ldo.svg "LDO")](https://ldomotors.com/)

LDO, Excellence in Motion. LDO is an official sponsor of Fluidd.

## Supporting Fluidd

Fluidd development is driven by passionate volunteers who dedicate their time to improving and expanding its capabilities.

Your sponsorship can help us enhance Fluidd, introduce new features, and ensure it remains accessible to all Klipper users.

Your support can make a significant impact on the evolution of Fluidd. Please consider [sponsoring Fluidd](https://github.com/sponsors/fluidd-core).

## Credits

A big thank you to:

- the [Voron Community](http://vorondesign.com/)
- Kevin O'Connor for [Klipper](https://github.com/Klipper3d/klipper)
- Eric Callahan for [Moonraker](https://github.com/Arksine/moonraker)
- Dominik Willner for [KIAUH](https://github.com/dw-0/kiauh)
- Ray for [MainsailOS](https://github.com/raymondh2/MainsailOS)
