---
title: Job Queue
---

# Job Queue

Fluidd's job queue lets you line up multiple G-code files for sequential
printing. Jobs are processed in order — when one print finishes, the next
one starts automatically (if configured) or waits for you to resume.

## Setup

Add `[job_queue]` to your `moonraker.conf` and restart Moonraker. See the
[Moonraker `[job_queue]` reference](https://moonraker.readthedocs.io/en/latest/configuration/#job_queue)
and the [Moonraker configuration](/configuration#example-configuration) for a
complete example.

!!! note "Manual start by default"
    By default, the queue pauses after each job completes and waits for you
    to start the next one. To enable fully automatic sequential printing,
    configure `automatic_transition` in Moonraker. See
    [Advanced settings](#advanced-settings).

Once enabled, Fluidd shows a job queue card on the dashboard and a queue tab
on the Jobs page.

## Adding jobs

There are several ways to add files to the queue:

- **Context menu** — right-click a G-code file in the
  [File Manager](/features/file-manager) and select **Add to queue**.
- **Drag and drop** — drag G-code files directly into the job queue card.
- **Bulk actions** — select multiple files in the file manager and use the
  **Add to queue** toolbar action.

The same file can be added to the queue multiple times.

## Managing the queue

The job queue card on the dashboard shows a compact view of queued jobs. For
full queue management, open the **Jobs** page from the navigation menu.

### Reordering

Drag jobs within the queue to change their order. The job at the top of the
list prints next.

### Multiplying jobs

Right-click a job and select **Multiply** to add additional copies. You can
also select multiple jobs and multiply them in bulk from the toolbar.

### Removing jobs

Remove individual jobs from the context menu, or select multiple jobs and
remove them in bulk. Use **Remove all** in the toolbar to clear the entire
queue.

### Pause and resume

- **Pause** — prevents the next job from loading after the current print
  finishes. The current print is not affected.
- **Resume** — resumes queue processing. If the printer is idle, the next
  job starts immediately.

## Queue status

The queue card shows the current state:

| State        | Description                                                          |
|--------------|----------------------------------------------------------------------|
| **Ready**    | Queue is active — the next job will load when the printer is free    |
| **Paused**   | Queue is on hold — waiting for you to resume                         |
| **Loading**  | Queue is loading the next job file                                   |
| **Starting** | Queue is requesting Klipper to start the print                       |

## Queue totals

The queue footer displays aggregated information across all queued jobs:

- **Filament** — total filament length and weight
- **Print time** — combined estimated print time
- **ETA** — estimated completion time for the entire queue, accounting for
  any print currently in progress

!!! warning "Missing metadata"
    If a queued file has been deleted from disk or lacks metadata, Fluidd
    shows a warning icon. The job remains in the queue but cannot contribute
    to totals or be reordered.

## Advanced settings

Moonraker's `[job_queue]` section supports additional options for automating
queue behavior — including automatic job transitions, transition delays,
G-code macros between jobs, and loading the queue on startup. For full
details, see the
[Moonraker job_queue documentation](https://moonraker.readthedocs.io/en/latest/configuration/#job_queue).
