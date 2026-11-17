# Print history

Read before touching `src/store/history/`, `JobHistory`, or `src/util/csv.ts`.

- The initial `server.history.list` fetch is bounded by `Globals.JOB_HISTORY_LOAD`.
  `history/onHistoryList` derives `allLoaded` from the echoed request's `limit`
  (`__request__.params`), so a short page and `limit: 0` ("Load all") both work
- Jobs referenced by listed files but outside the loaded window are back-filled by
  `history/fetchMissingJobs`, in chunks of `Globals.JOB_HISTORY_FETCH_CHUNK`, each landing as
  **one** `setUpdateHistoryJobs` commit — a per-job commit froze large directories. Not-found
  errors are suppressed: Moonraker may have pruned the job
- `unresolvedJobIds` holds ids in flight **and** confirmed not-found; success or any other failure
  removes the id. `onHistoryList` must never clear it (that would re-send in-flight requests and
  re-ask pruned jobs)
- Look jobs up via `history/getHistoryByIdMap`, not a scan of `getHistory`
- CSV export (`JobHistory.handleExportCsv`) always exports the **whole** history (fetching
  `limit: 0` first when needed), with filename plus the visible columns, ignoring search.
  `getExportValue` returns raw base-unit values (a `Date` for dates), no units in headers.
  `Waits.onHistoryExport` is managed by hand because it spans fetch, build and download
- `toCsv` (`src/util/csv.ts`, import-free) owns cell formatting: RFC 4180, CRLF, `Date` → local
  `YYYY-MM-DD HH:mm:ss` (Excel won't parse ISO with `T`/`Z`), arrays joined with `; `, and a
  leading `'` on formula-like **strings** only (numbers exempt so negatives sum). Callers prepend
  a `\uFEFF` BOM
