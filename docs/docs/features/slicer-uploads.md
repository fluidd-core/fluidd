---
title: Slicer Uploads
---

# Slicer Uploads

Most popular slicers can upload G-code files directly to your printer. This
works through Moonraker's OctoPrint compatibility layer — your slicer thinks
it is talking to OctoPrint, and Moonraker translates the requests.

## Prerequisites

Add the `[octoprint_compat]` section to your `moonraker.conf` and restart
Moonraker. Without this, slicer uploads will not work. See the
[Moonraker configuration](/configuration#example-configuration) for a
complete example.

```ini title="moonraker.conf"
[octoprint_compat]
```

## OrcaSlicer

1. Open **Printer Settings**.
2. In the **Connection** section, set **Host Type** to **OctoPrint**.
3. Enter your printer URL in the **Hostname, IP or URL** field — for example
   `http://printer.local` or `http://192.168.1.100`.
4. Enter any non-empty string in the **API Key** field — the value is not
   validated.
5. Click **Test** to verify the connection.

After slicing, use the **Print** or **Send** button to upload directly to
your printer.

## PrusaSlicer / SuperSlicer

1. Open **Printer Settings** and click the cog icon next to the printer
   profile dropdown.
2. Select **Add physical printer**.
3. Enter a descriptive name and choose the correct printer preset.
4. Set the type to **OctoPrint**.
5. Enter your printer URL in the **Hostname, IP or URL** field — for example
   `printer.local` or `192.168.1.100`. You may need to append the
   Moonraker port (e.g. `:7125`) depending on your setup.
6. Enter any non-empty string in the **API Key** field.
7. Click **Test** to verify the connection.

![PrusaSlicer physical printer configuration with connection details](/assets/images/physical-printer.png)
![Slicer upload confirmation showing the file being sent to Fluidd](/assets/images/slicer-upload.png)

## Cura

Install the
[OctoPrint Connection](https://github.com/fieldOfView/Cura-OctoPrintPlugin)
plugin from the Cura Marketplace. Then:

1. Open **Settings** and select **OctoPrint** under **Printers**.
2. Click **Add** and enter your printer URL — for example
   `http://printer.local` or `http://192.168.1.100`.
3. Enter any non-empty string in the **API Key** field.
4. Click **Connect** to verify.

After slicing, use the **Print with OctoPrint** button to upload.

## Troubleshooting

### Connection refused

- Verify Moonraker is running — try opening
  `http://<your-printer>/server/info` in a browser.
- Check that `[octoprint_compat]` is present in `moonraker.conf` and that
  Moonraker has been restarted after adding it.
- If your Moonraker instance runs on a non-default port, append the port to
  the URL (e.g. `http://192.168.1.100:7125`).

### API key is invalid

The API key field is not validated by Moonraker — any non-empty string will
work. If your slicer rejects the key, ensure the field is not blank.

### Upload succeeds but the print does not start

Check whether your slicer's "start print after upload" option is enabled. If
it is disabled, the file will be uploaded but you will need to start the print
manually from Fluidd.
