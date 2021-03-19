import { LocaleInfo } from '../helper'

export const info = new LocaleInfo('us', 'en', 'English')
export default {
  app: {
    updater: {
      title: 'Software Updates',
      to: 'to {version}',
      check: 'Check for updates'
    },
    warnings: {
      found: '{appName} warnings found.',
      failedPlugins: 'Moonraker has failed plugins, please check your logs, update your configuration and restart moonraker.',
      fluiddReq: ['Fluidd setup requirements can be found ', 'here.'],
      moonrakerPluginConfig: ['Moonraker plugin configuration can be found ', 'here.']
    },
    host: {
      title: 'Host',
      reboot: { title: 'Reboot', confirm: 'Are you sure? This will reboot your host system.' },
      shutdown: { title: 'Shutdown', confirm: 'Are you sure? This will shutdown your host system.' },
      powerPlugin: 'Power Plugin'
    },
    services: {
      title: 'Services',
      restart: {
        moonraker: 'Restart Moonraker',
        klipper: 'Restart Klipper',
        firmware: 'Firmware Restart Klipper'
      }
    },
    degree: {
      celsius: '°C'
    },
    connection: {
      try: 'Connecting to moonraker...',
      fail: 'No moonraker connection. Please check moonraker status and / or refresh.'
    },
    form: {
      required: 'Required',
      invalidUrl: 'Invalid URL',
      min: 'Min {min}',
      max: 'Max {max}',
      minOr: 'Min {min} or {alt}',
      maxOr: 'Max {max} or {alt}'
    },
    chips: {
      active: 'active'
    },
    btn: {
      close: 'Close',
      pause: 'Pause',
      cancel: 'Cancel',
      resume: 'Resume',
      resetFile: 'Reset File',
      resetDefault: 'Reset to Default',
      reprint: 'Reprint',
      on: 'On',
      off: 'Off',
      standy: 'Standby',
      enabled: 'Enabled',
      add: 'Add',
      save: 'Save',
      no: 'No',
      yes: 'Yes',
      saveClose: '@:app.btn.save & @:app.btn.close',
      saveRestart: '@:app.btn.save & Restart',
      finish: 'Finish',
      updating: 'Updating...',
      uploading: 'Uploading...',
      processing: 'Processing...',
      all: 'All',
      refresh: 'Refresh',
      retract: 'Retract',
      extrude: 'Extrude',
      forceRefresh: 'Force Refresh'
    },
    bar: {
      dashboard: 'Dashboard',
      jobs: 'Jobs',
      printer: 'Printer',
      estop: 'Emergency Stop'
    },
    drawer: {
      pconfig: 'Printer Configuration',
      uiSettings: 'UI Settings'
    },
    versionStatus: {
      updated: { msg: 'UP TO DATE', dialog: 'Updates finished' },
      update: { msg: 'UPDATE', dialog: 'Updating, please wait...' },
      dirty: { msg: 'DIRTY', desc: 'indicates local changes to the repo' },
      invalid: { msg: 'INVALID', desc: 'indicates a detached head, not on master or an invalid origin' }
    },
    i18n: {
      title: 'Internalization',
      choose: 'Choose your language:',
      languages: 'Languages',
      auto: 'Automatic'
    },
    theme: {
      title: 'Theme',
      subTitle: 'Define a primary color, and whether to show in dark mode or not',
      darkMode: 'Dark Mode'
    },
    layout: {
      title: 'Layout',
      adjust: 'Adjust dashboard layout',
      reset: 'Reset dashboard layout'
    }
  },
  printer: {
    title: 'Printers',
    add: {
      title: 'Add printer',
      another: 'Add another printer',
      apiUrl: 'API URL',
      tooltip: [
        'Enter your @.upper:printer.add.apiUrl.',
        'Some examples might be;'
      ],
      docs: [
        'Having trouble?',
        'See here',
        'for more information.'
      ]
    },
    bed: {
      mesh: {
        title: 'Bed Mesh',
        empty: 'No existing bed meshes found.',
        name: 'Name',
        variance: 'Variance',
        load: 'Load Profile',
        delete: 'Delete Profile. This WILL restart your printer.',
        clear: 'Clear Profile',
        calibrate: { text: 'Calibrate', tooltip: 'Begins a new calibration, saving as profile \'default\'' },
        saveAs: {
          text: 'Save Config As...',
          tooltip: 'Commits calibrated profile to printer.cfg. This WILL restart your printer.',
          name: 'Profile Name',
          remove: 'Remove {name} profile',
          help: 'If saving as something other than {name}, you can choose to also remove the {name} profile.'
        }
      },
      adjustaments: {
        title: 'Bed Adjustments'
      }
    },
    sensors: {
      endstops: {
        title: 'Endstops',
        subTitle: 'Use the refresh button to update endstop status.',
        state: {
          open: 'OPEN',
          triggered: 'TRIGGERED'
        }
      },
      runout: {
        title: 'Runout Sensors'
      }
    },
    logs: {
      title: 'Printer Logs'
    },
    camera: {
      title: 'Camera',
      flipH: 'Flip horizontally',
      flipV: 'Flip vertically',
      stream: {
        label: 'Stream type',
        url: 'Camera URL',
        types: {
          mjpgstreamer: 'mjpgstreamer',
          ipcamera: 'ip camera'
        }
      }
    },
    console: {
      title: 'Console',
      hideTemp: 'Hide temp waits',
      placeHolder: '\'tab\' for autocomplete, \'arrows\' for history, \'help\' for commands'
    },
    jobs: {
      title: 'Jobs',
      disabledTooltip: 'Jobs are disabled prior to initial communication with klippy'
    },
    macros: {
      title: 'Macros',
      subTitle: 'Configure which macros appear on the dashboard'

    },
    outputs: {
      title: 'Fans & Outputs',
      fans: {
        fan: 'Part Fan',
        stepstick_fan: 'Stepstick Fan',
        extruder_fan: 'Extruder Fan'
      }
    },
    limits: {
      title: 'Printer Limits',
      speed: 'Velocity',
      acceleration: 'Acceleration',
      squareCornerSpeed: 'Square Corner Velocity',
      accelDecel: 'Acceleration to Deceleration'
    },
    status: {
      title: 'Status',
      confirmCancel: 'Are you sure? This will cancel your print.',
      etl: 'Estimated time left',
      durationTotal: 'Duration & Total',
      duration: 'Duration',
      filamentEstimate: 'Used filament',
      klippy: {
        title: 'Klippy: {klippyState}',
        restart: {
          klippy: 'Restart Klipper',
          service: 'Firmware Restart'
        }
      }
    },
    temperature: {
      title: 'Thermals',
      tooltip: 'Hold shift to zoom.<br />Click an item to toggle in the graph.<br />Click a power to toggle in the graph.',
      preset: {
        title: 'Temperature Preset',
        subTitle: 'Apply predefined temperatures on the dashboard',
        add: 'Add preset',
        edit: 'Edit preset',
        name: 'Preset Name'
      },
      heaters: {
        extruder: 'Extruder',
        heater_bed: 'Bed'
      },
      status: {
        item: 'Item',
        power: 'Power',
        current: 'Current',
        target: 'Target',
        allOff: 'All off'
      },
      high: 'high {temp} {degree}',
      low: 'low {temp} {degree}'
    },
    tool: {
      title: 'Tool',
      tooltip: 'extruder disabled, below min_extrude_temp ({minExtrudeTemp}<small>{degree}</small>)',
      motorsOff: 'Motors @.upper:app.btn.off',
      bedScrewAdjust: 'Adjust Bed Screws',
      screwsTiltCalculate: 'Calculate Screws Tilt',
      zTiltAdjust: 'Adjust Z Tilt',
      qgl: 'QGL',
      invert: {
        x: 'Invert X',
        y: 'Invert Y',
        z: 'Invert Z'
      },
      useGCodeCoord: {
        text: 'Use GCode Coordinates',
        tooltip: 'Use GCode position instead of toolhead position on dashboard'
      },
      default: {
        eLength: 'Default Extrude Length',
        eSpeed: 'Default Extrude Speed',
        moveLength: 'Default Toolhead move length',
        xyMoveSpeed: 'Default Toolhead XY Move Speed',
        zMoveSpeed: 'Default Toolhead Z Move Speed'
      },
      current: {
        rSpeed: 'Requested Speed:',
        eLength: 'Extrude Lenght',
        eSpeed: 'Extrude Speed',
        xyzMoveSpeed: 'Speed',
        eFlow: 'Flow',
        zOffset: 'Z Offset: '
      },
      home: {
        xy: 'Home XY',
        z: 'Home Z'
      }
    },
    misc: {
      title: 'Misc',
      name: 'Printer Name'
    },
    timeEstimate: {
      title: 'Print Times',
      types: {
        totals: {
          text: 'Duration Only',
          tooltip: 'Similar to a klipper LCD, this only shows duration with no estimates.'
        },
        slicer: {
          text: 'Slicer',
          tooltip: 'Uses the slicer estimates for display. You must enable this in your slicer.'
        },
        file: {
          text: 'File Extimation',
          tooltip: 'Takes progress percent, and duration to estimate total duration.<br />More accurate over time.'
        },
        filament: {
          text: 'Filament',
          tooltip: 'Takes used filament vs estimated filament to estimate total duration.<br />More accurate over time.'
        }
      }
    },
    fileSystem: {
      drag: ['Drag', 'a file here'],
      empty: 'No files',
      emptySearch: '@:printer.fileSystem.empty found',
      search: 'Search',
      action: {
        print: 'Print',
        edit: 'Edit',
        view: 'View',
        download: 'Download',
        rename: 'Rename',
        remove: 'Remove',
        createDir: 'Create Directory',
        addFolder: 'Add Folder',
        createFile: 'Create File',
        upload: 'Upload',
        uploadPrint: 'Upload & Print',
        uploadFiles: ['Uploading', 'Files']
      },
      headers: {
        name: 'Name',
        modified: 'Modified',
        size: 'Size',
        filament: 'Filament',
        height: 'Height',
        'layer height': 'Layer Height',
        'estimated time': 'Estimated Time'
      }
    }
  }
}
