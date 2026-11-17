# Charts

Read before touching `src/util/chart-*.ts`, `src/store/charts/`, `ThermalChart`, `DiagnosticsCard`, or any ECharts `dataset` code.

- Data lives in a **columnar ring buffer** (`src/util/chart-buffer.ts`): a `time` `Float64Array`
  plus a `Map` of `Float64Array` columns, all sharing one sample index and one live window
  `[offset, offset + count)`. Read only through `chartBufferSource` / `chartBufferColumn` /
  `chartBufferLastValue` / `chartBufferLastTime` — never index a column directly
- **`revision` is the only reactive change signal** — Vue sees neither the typed arrays nor the
  `Map`. Nothing goes through `Vue.set`; consumers re-run because `chartBufferSource` reads
  `revision`
- Missing values are `NaN`, never `undefined` or a hole — every sample advances every column
- `appendChartSamples` is the only append primitive: one `revision` bump per batch.
  `setChartEntry` / `setChartEntries` wrap it
- **Append in non-decreasing time order** (`dropExpired` binary-searches). So the thermal history
  load replaces the buffer wholesale (`setThermalStore`), and `charts/onMoonrakerStats` — which
  also handles the live notification — appends only stats past the buffer's tail
- `retention` is **seconds**, never a sample count
- Retention: `CHART_HISTORY_RETENTION` (thermal, diagnostics) and `CHART_SYSTEM_RETENTION`
  (system, MCU, sensor). Only thermal is server-configured (`temperature_store_size`, via
  `charts/getChartRetention`), so only its `setChartEntry` payload carries `retention`
- `charts/resetChartStore` resets **only `thermal` and `ready`** — a klippy restart doesn't
  re-fetch `machine.proc_stats`, so the other buckets would have nothing to refill from
- ECharts: dataset updates use `{ replaceMerge: 'dataset' }`; a source keeps `Object.prototype`
  and has `date` first — reasons are commented at `AppChart.onData` and `chartBufferSource`
- Tooltip `param.value` is a positional array with a keyed-columns source — resolve it with the
  `src/util/chart-tooltip.ts` helpers
- Thermal history (`thermal-history.ts`) is right-aligned on a 1Hz timeline with a padded lead-in.
  The padding is load-bearing: `ThermalChart`'s x-axis is `max: 'dataMax'`,
  `min = max - retention * 1000`. `null` samples become `NaN`, never `0`
- Thermal column names are `<sensor>` or `<sensor>#<target|power|speed>` — always use
  `thermalColumn` / `parseThermalColumn` (`src/store/charts/thermal-columns.ts`); sensor names may
  contain `#`
- Smoothing (`smoothChartSource`, `uiSettings.general.chartSmoothingWindow` seconds, 0 = off)
  applies only to bare thermal columns, never targets, power or fan speed. `ThermalChart` watches
  the raw inputs, not the smoothed source
