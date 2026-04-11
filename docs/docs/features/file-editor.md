---
title: File Editor
---

# File Editor

Fluidd includes a built-in code editor powered by Monaco (the engine behind
VS Code) for editing Klipper configuration files, G-code, and other files
directly from your browser.

!!! warning "Performance"
    The editor handles most config files without issue. For very large G-code
    files (over ~5 MB), the editor may be slow to load and syntax highlighting
    may be limited. For large G-code files, the
    [File Manager](/features/file-manager) and G-code preview are better tools
    than the editor.

## Syntax highlighting

Rich, TextMate grammar-based syntax highlighting is provided for the following
file types:

| File Type                                                 | Highlighted Elements                                                                                                                                                                             |
|-----------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Klipper config** (`.cfg`, `.conf`)                      | Section headers, keys and values, pin references, sensor and thermistor types, driver types, serial paths, booleans, numbers, and embedded G-code within macros including Jinja2 template blocks |
| **G-code** (`.gcode`, `.g`, `.gc`, `.gco`, `.ufp`, `.nc`) | G/M/T commands, coordinates, feed rates, tool and offset registers, math functions, macro variables, and control keywords                                                                        |
| **Log files** (`.log`)                                    | Log-level colorization (debug, info, warning, error, critical), timestamps, URLs, UUIDs, git SHAs, exception names, and stack traces                                                             |
| **JSON**                                                  | Full validation and IntelliSense via a dedicated language worker                                                                                                                                 |
| **CSS, SCSS, Less**                                       | Property completion, hover, and validation via a dedicated language worker                                                                                                                       |
| **Markdown**                                              | Basic syntax highlighting                                                                                                                                                                        |

## Documentation links

When editing Klipper config files, clickable **CodeLens** links appear above
each `[section]` header — linking directly to the relevant documentation page
for:

- [Klipper](https://www.klipper3d.org/Config_Reference.html)
- [Kalico](https://docs.kalico.gg/Config_Reference.html)
- [Danger Klipper](https://dangerklipper.io/Config_Reference.html)
- [Moonraker](https://moonraker.readthedocs.io/en/latest/configuration/)
- [crowsnest](https://crowsnest.mainsail.xyz/)
- [moonraker-telegram-bot](https://github.com/nlef/moonraker-telegram-bot/wiki)

The correct documentation source is detected automatically based on the file
being edited. This feature can be disabled in the editor settings.

## Outline and navigation

Klipper config files provide a two-level document outline:

- **Sections** — each `[section_name]` block
- **Properties** — each `key: value` or `key = value` within a section

Use ++ctrl+shift+o++ (or ++cmd+shift+o++ on macOS) to jump to any section or
property, or browse the outline panel.

## Code folding

Collapsible regions are supported for both Klipper config and G-code files.

**Klipper config:**

- Section blocks — collapse an entire `[section]` and its contents
- Comment blocks — consecutive comment lines fold together
- Named regions — `#region` / `#endregion` markers for custom foldable areas

**G-code:**

- Print layers — each `SET_PRINT_STATS_INFO ... CURRENT_LAYER=N` starts a
  foldable layer block
- Exclude objects — `EXCLUDE_OBJECT_START` / `EXCLUDE_OBJECT_END` pairs
- Thumbnail blocks — `; thumbnail begin` / `; thumbnail end` comment sections
- Comment blocks — consecutive `;` comment lines fold together

## Keyboard shortcuts

| Action           | Shortcut                           |
|------------------|------------------------------------|
| Save             | ++ctrl+s++ / ++cmd+s++             |
| Save As          | ++ctrl+shift+s++ / ++cmd+shift+s++ |
| Save and Restart | ++ctrl+alt+s++ / ++cmd+alt+s++     |
| Emergency Stop   | ++ctrl+shift+e++ / ++cmd+shift+e++ |
| Go to Line       | ++ctrl+g++                         |
| Go to Symbol     | ++ctrl+shift+o++ / ++cmd+shift+o++ |
| Command Palette  | ++f1++                             |

All actions are also accessible from the Command Palette. For application-wide
shortcuts and navigation hotkeys, see
[Keyboard Shortcuts](/features/keyboard-shortcuts).

## View state persistence

The editor remembers your scroll position, cursor location, and folding state
for each file. This can be configured in the editor settings:

- **Local storage** — persists across browser restarts
- **Session storage** — persists within the current browser session
- **Off** — no persistence
