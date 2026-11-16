# HTML rendering & sanitization

Read before using `v-safe-html`, rendering user/macro/Moonraker text, or touching `src/directives/safe-html.ts`, `src/util/sanitize-html.ts`, `src/util/html-helpers.ts`, `src/util/mark-text-nodes.ts`, `ConsoleItem`, or the `AppNamed*` controls.

## Plain text vs HTML

- Render plain text as `<span class="text-pre-wrap">{{ value }}</span>`, on one line so
  `pre-wrap` doesn't reveal template whitespace. Not `v-text` (lint rejects it on components).
  Not `v-safe-html`: it parses HTML, so `<none>` vanishes and an unterminated `<min` eats the rest
- Plain-text renderers: `AppNamedSwitch`/`Select`/`Slider`/`TextField`, `StatusLabel`,
  `CollapsableCard`'s `subTitle`. Put markup in their `label` slot instead (see `OutputFan`)
- HTML renderers (their locale strings carry markup): `AppInlineHelp` tooltips, `AppDragOverlay`
  messages, `ExtruderStats` strings
- Store raw newlines, never `<br>`; plain-text locale strings use real newlines

## `AppNamed*` controls

- `AppNamedSelect` / `Slider` / `TextField` lay out through `AppNamedContainer` (label column
  `cols="12" sm="5"`, plain-text fallback); `AppNamedSwitch` doesn't. Each control keeps
  `inheritAttrs: false` and binds `$attrs` to its input — the container doesn't, so attributes on
  it land on its `v-row`
- Forward the `label` slot only when given:
  `<template v-if="$scopedSlots.label" #label><slot name="label" /></template>` — use
  `$scopedSlots`; a `v-slot` slot is not always in `$slots`

## Building and sanitizing HTML

- `src/util/html-helpers.ts` (import-free): `escapeHtml` escapes `& < > " '` (safe in text and
  quoted attributes); `linkExternalUrls` escapes everything except the anchors it generates
- `v-safe-html` sanitizes with `sanitizeHtml` (`src/util/sanitize-html.ts`, which owns the
  DOMPurify config and hooks) and inserts the fragment with `replaceChildren`, **never
  `innerHTML`** — no serialize/re-parse for mutation XSS
- Link hook: an `<a>` (HTML or SVG) whose `href` (or `xlink:href`) resolves to an external
  `http(s)` host gets `target="_blank"` — decided with `new URL` against a dummy base, not a
  regex, so `\\x.com` and `https:x.com` are caught. An author's `_blank` is kept. Every `_blank`
  gets `noopener noreferrer`. No-`href`, relative, hash, `mailto:` and `tel:` links stay in the
  same tab
- Value is a string or `{ html, search? }`; `search` is highlighted by `markTextNodes` (raw term,
  case-insensitive, `<mark>` in text nodes only, skipping `<style>`). The directive compares
  `html` and `search` field by field, since an object value is new on every render

## Console

- `ConsoleItem` renders a `response` as HTML only when `hasRenderableHtml` finds markup DOMPurify
  keeps (behind a `/<[a-z]/i` pre-check); otherwise it escapes it and adds command links. So
  `<none>` or `M163 [P<factor>]` keep the message plain — important because `help` arrives as one
  entry. Limits: placeholders named like real tags (`<b>`, `<p>`, …) render as HTML, and in a
  message with real markup other `<word>`s are dropped
- Stored messages stay raw. Search uses `{ html, search }`, so tags/attributes/entities can't
  match and a match can't span elements. `itemClick` resolves a click on `<mark>` to its anchor
