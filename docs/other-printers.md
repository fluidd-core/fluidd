# Other printers

Fluidd can keep direct printer connections in this browser. Printer addresses and live traffic stay on the local network; they do not go through Muon3D's servers. Credentials are kept for this browser only: encrypted in IndexedDB when remembered, or in session storage otherwise.

## Direct connections

| Printer | Status, temperatures, camera | Pause / resume | Stop | Files / print from storage | Upload |
| --- | --- | --- | --- | --- | --- |
| Klipper / Moonraker | Yes | Yes | Yes | Yes | Yes |
| OctoPrint | Yes | Yes | Yes | Yes | Yes |
| Creality stock firmware | Yes | Yes | Yes | No | No |
| Elegoo Centauri Carbon | Yes | Yes | Yes | Yes | No |

Fluidd does not offer axis movement, homing, calibration, or firmware updates for these connections. For unsupported actions, use the printer's own screen.

### Klipper / Moonraker

Allow this page's origin in Moonraker's `[authorization]` section:

```ini
[authorization]
cors_domains:
  <location.origin>
```

Restart Moonraker. Fluidd reads status over Moonraker's WebSocket and REST endpoints. An API key may be supplied if configured.

### OctoPrint

In **Settings > API**, enable **Allow Cross Origin Resource Sharing**, then restart OctoPrint. Enter an API key or ask OctoPrint for one in the Add dialog. App-key requests must be approved in OctoPrint. Fluidd uses the API key for REST and the local push connection.

### Creality stock firmware

Connect the printer and this browser to the same local network. Fluidd reads its stock-firmware WebSocket status and can pause, resume, or stop a print. The camera is shown when the printer publishes the supported MJPEG stream. Start jobs from the printer's own screen.

### Elegoo Centauri Carbon

Connect the printer and this browser to the same local network. Fluidd uses the printer's SDCP v3 connection to read status and files, and to pause, resume, stop, or start a stored file. A camera is shown only when the printer publishes an HTTP(S) URL; RTSP is not shown in the browser. Upload from Fluidd is not available.

## Needs an M1 bridge

These brands are not direct browser adapters. Each needs an M1 bridge on the same network; bridging is a separate task. Fluidd does not save them as direct printers or claim browser control for them here.

- **Bambu Lab:** enable LAN Only mode on the printer. Developer Mode is needed for third-party control; LAN Only Liveview is optional for viewing the live screen. Follow the manufacturer's LAN Mode guide.
- **Prusa / PrusaLink:** set up PrusaLink on the printer, then connect it through an M1 bridge. See the manufacturer's Prusa Connect and PrusaLink guide.
- **Anycubic:** connect the printer to the local network using its model's network guide, then connect it through an M1 bridge.

## Browser notes

The direct printers in this guide use plain HTTP or WebSockets on the local network. Firefox and Safari block this page when it is served over HTTPS and tries to contact a printer over plain HTTP (mixed content). Chrome can reach printers on your network; open Fluidd in Chrome if the browser blocks the connection. Moonraker and OctoPrint also need their CORS settings configured as described above.

## Sources

- [Moonraker authorization and CORS](https://moonraker.readthedocs.io/en/latest/configuration/#authorization)
- [OctoPrint API and CORS](https://docs.octoprint.org/en/master/api/general.html)
- [OctoPrint Job API](https://docs.octoprint.org/en/master/api/job.html)
- [OctoPrint Printer API](https://docs.octoprint.org/en/master/api/printer.html)
- [OctoPrint Files API](https://docs.octoprint.org/en/master/api/files.html)
- [OctoPrint push protocol](https://docs.octoprint.org/en/master/api/push.html)
- [OctoPrint app keys](https://docs.octoprint.org/en/master/bundledplugins/appkeys.html)
- [Creality stock-firmware WebSocket implementation](https://github.com/3dg1luk43/ha_creality_ws)
- [Elegoo SDCP v3 protocol](https://github.com/cbd-tech/SDCP-Smart-Device-Control-Protocol-V3.0.0)
- [Centauri Carbon SDCP implementation](https://github.com/WalkerFrederick/sdcp-centauri-carbon)
- [Bambu Lab LAN Mode guide](https://wiki.bambulab.com/en/knowledge-sharing/enable-lan-mode)
- [Prusa Connect and PrusaLink explained](https://help.prusa3d.com/article/prusa-connect-and-prusalink-explained_302608?product=prusa-connect)
- [Anycubic Kobra 3 Combo network guide](https://wiki.anycubic.com/en/fdm-3d-printer/kobra-3-combo/network-connection-guide)
