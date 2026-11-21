# Documentation site

Read before touching anything under `docs/`.

## Site

- **Zensical** (Material for MkDocs successor); config in `docs/zensical.toml`, content in
  `docs/docs/`, Jinja overrides in `docs/overrides/`, abbreviation glossary in
  `docs/includes/glossary.md` (auto-appended to every page)
- **`[project.markdown_extensions]` replaces Zensical's defaults, it doesn't merge** — anything
  omitted is off (dropping `toc.permalink` removes every heading anchor). Keep it in sync with
  `zensical/bootstrap/zensical.toml` in the installed package
- `pymdownx.tabbed` slugs tabs as `#<enclosing-heading>-<tab-label>`. Replacing a heading with a
  tab changes its anchor — add an anchor redirect in `[project.plugins.redirects.redirect_maps]`
  (`"page.md#old" = "page.md#new"`)
- `llmstxt` only includes pages matched by its `sections` — add new top-level pages there
- `social` cards need `background_color` / `color` in `cards_layout_options` (no palette
  `primary`); it fetches Google Fonts at build time
- `privacy` uses an **`assets_include` allow-list** — never switch to exclusions: the theme
  references lazy libraries whose ad SDKs fail the `--strict` build
- `optimize` is deliberately off (it would require `pngquant` for every local serve)
- Commands: install `cd docs && python3 -m venv .venv && source .venv/bin/activate && pip install -r
  requirements.txt`; build `zensical build --clean --strict` (warnings, incl. broken links, fail);
  serve `pnpm run serve:docs` (localhost:8000)
- CI (`docs.yml`) builds and lints on PRs and `master`/`develop` pushes; only `master` deploys.
  markdownlint runs via `pnpm dlx` since `npx` can't run in this repo

## Writing

- Before committing, both must be clean: `markdownlint --config docs/.markdownlint.json docs/docs/`
  and `codespell docs/docs/`
- Frontmatter: `title` (required), `description` (required — folded `>-` scalar, aim for 100–155
  chars; used for `<meta name="description">` and social cards, which cut text past ~160), `icon`
  (top-level pages only, Lucide). The `meta-descriptions` plugin only fills in pages missing one
  from their first paragraph — don't rely on it; its `trim` option cuts mid-sentence, keep it off
- Internal links are **relative `.md` paths** (`printing.md#thumbnails`) — site-absolute links
  skip link validation. Images are site-absolute: `/assets/images/…` (in
  `docs/docs/assets/images/`)
- Code blocks always have a language: `ini` (Klipper/Moonraker config), `bash`, `json`, else `text`
- Every block nested in a list (sub-list, paragraph, code block, blockquote) is indented 4 spaces
  per nesting level, no tabs
- Tables use aligned pipe style
- `{.md-button}` for standalone action links; `++key++` instead of `<kbd>`
- Terminology: G-code, Wi-Fi, GitHub, Node.js, SD card; em dash (—) for parenthetical dashes
- Inline code for macro names (`PAUSE`), section names (`[virtual_sdcard]`) and config variables —
  except in headings
- New domain-specific acronyms (not USB/HTTP/CPU) go in the glossary
