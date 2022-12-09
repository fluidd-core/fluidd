---
layout: default
title: Diagnostics
parent: Features
nav_order: 16
permalink: /features/diagnostics
---

# Diagnostics
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

The diagnostics dashboard is an opt-in feature, currently in beta, that allows
you to plot various metrics about your printer in a customizable dashboard.

The feature can be enabled in the Fluidd settings under the general section.

### Dashboard
The dashboard is separated into 4 columns and allows you to customize the
position of each chart. To edit the dashboard layout, simply open Fluidd's
layout editor via the side menu:

![screenshot](/assets/images/side_menu.png)
![screenshot](/assets/images/adjust_layout.png)

### Configuration
The dashboard comes preloaded with a chart to plot speeds and flow rates.  
This should give a general overview on how to configure individual charts.  
By clicking "Add Chart" or "Edit Chart" in the dashboard, a configuration
dialog will open guiding you through the setup process:

![screenshot](/assets/images/diagnostics_edit_card.png)

#### Metrics Collector
Each plotted metric runs a collector, based on user-defined JavaScript code.  
Metrics are collected once a second or every 250ms when a stepper motor is active.

The default configuration acts as a starting point for scripting your own collectors.  
You can test your script by clicking the play icon in the collector config.

The example below calculates the current flow rate based on the printers
`live_extruder_velocity` and the `filament_diameter` set in the config file.

![screenshot](/assets/images/diagnostics_collector_config.png)

#### Metrics Explorer

A metrics explorer is available to check the available data points as well as
aid in the creation of scripts. Data points can be inserted into the collector
script by clicking their key (name) in the metrics explorer:

![screenshot](/assets/images/diagnostics_metrics_explorer.png)
