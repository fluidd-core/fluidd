---
title: File Manager
---

# File Manager

Fluidd's file manager provides access to all printer files organized by root
location. Browse, upload, edit, and manage G-code files, configuration,
logs, and more — all from your browser.

## File roots

| Root                | Description                                        | Writable |
|---------------------|----------------------------------------------------|----------|
| **gcodes**          | G-code files for printing                          | Yes      |
| **config**          | Printer configuration files                        | Yes      |
| **config_examples** | Reference configuration examples                   | No       |
| **docs**            | Documentation files                                | No       |
| **logs**            | Klipper, Moonraker, and system logs                | No       |
| **timelapse**       | Timelapse recordings and thumbnails (when enabled) | Yes      |

Custom roots can be added via Moonraker's
[`registered_directories`](https://moonraker.readthedocs.io/en/latest/configuration/#file_manager)
configuration.

## File operations

The file manager supports the following operations, available from the context
menu (right-click) or toolbar:

- Upload files with real-time progress tracking (percentage, speed, bytes)
- Download files
- Rename files and folders
- Copy / duplicate files and folders
- Move files between directories
- Delete files and folders (with confirmation)
- Create new files and folders
- Create ZIP archives from single or multiple items

When opening G-code preview for very large files (over 100 MB), Fluidd
prompts for confirmation before loading.

!!! tip "Large files"
    Moonraker's default upload size limit is 1024 MiB. For larger G-code
    files, increase `max_upload_size` in `moonraker.conf`:

    ```ini title="moonraker.conf"
    [server]
    max_upload_size: 2048
    ```

    Very large files may also cause the upload to time out in the browser.
    Consider using `curl` or another tool for files over 500 MiB.

## G-code features

When browsing the gcodes root, additional actions are available:

- **Print** — start a print job directly from the file browser
- **Add to queue** — enqueue files for sequential printing (requires
  `[job_queue]`)
- **Preheat** — set bed, extruder, and chamber temperatures from file metadata
- **Refresh metadata** — re-scan file metadata from Moonraker
- **Time analysis** — calculate accurate print time estimates (requires
  `[analysis]`)
- **G-code preview** — load the file in the 3D G-code viewer

G-code files also display rich metadata columns that can be toggled from the
column picker: slicer name and version, filament type and usage, temperatures,
layer heights, estimated print time, last print date, and more.

## Search and navigation

- **Live search** — filter files in the current directory by name in real time
- **Go to file** — fuzzy search across the entire root to jump directly to any
  file
- **Breadcrumb navigation** — click any segment of the current path to navigate

## Drag and drop

Drag and drop can be enabled in General Settings:

- **Between folders** — drag files to move them into a different directory
- **From desktop** — drop files or folders from your OS to upload them
- **Multi-select drag** — drag one item to move all selected items together

## Bulk operations

Select multiple files using checkboxes to access bulk actions:

- Delete selected files
- Create ZIP archive
- Refresh metadata (G-code root only)
- Perform time analysis (G-code root only)
- Add to print queue (G-code root only)

!!! note "ZIP archives"
    ZIP archives are created on the server and stored in the same directory as
    the selected files. To download multiple files at once, create an archive
    first and then download it.

## Filtering

Each root offers filters to hide specific file types:

| Filter                     | Roots          | Description                                      |
|----------------------------|----------------|--------------------------------------------------|
| Hidden files               | all            | Files starting with `.`                          |
| Klipper backup files       | config         | Auto-generated `printer-YYYYMMDD_HHMMSS.cfg`     |
| Moonraker backup files     | config         | `.moonraker.conf.bkp` files                      |
| Crowsnest backup files     | config         | `crowsnest.conf.YYYY-MM-DD-HHMM` files           |
| Temporary upload files     | gcodes, config | Moonraker `.mru` temp files                      |
| Rolled log files           | logs           | Rotated logs (`.log.1`, date patterns)           |
| Printed files              | gcodes         | Filter by print history (requires `[history]`)   |

## File previews

The file manager can preview files in-browser:

- **Images** — `.bmp`, `.gif`, `.jfif`, `.jpg`, `.jpeg`, `.png`, `.svg`,
  `.tif`, `.tiff`, `.webp`
- **Videos** — `.mp4`, `.mpeg`, `.mpg`
- **Markdown** — `.md`, `.markdown`, and `.mdown` files rendered with full
  formatting
- **G-code thumbnails** — slicer-generated preview images displayed in the file
  list

Thumbnail size is adjustable per root from the toolbar.

## Built-in editor

Files can be opened in the built-in [file editor](/features/file-editor)
with syntax highlighting, CodeLens documentation links, code folding, and
keyboard shortcuts.

## Disk usage

A warning icon appears in the toolbar when free disk space drops below the
lower of 1 GB or 20% of total capacity.
