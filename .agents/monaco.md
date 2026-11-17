# Monaco editor

Read before touching `src/monaco/`, `src/components/widgets/filesystem/setupMonaco.ts`, or the `monaco*` workers.

- `setupMonaco.ts` registers languages, themes, workers and providers. Monarch tokenizers live in
  `src/monaco/language/*.monarch.ts`
- `gcode-rules.ts` is the shared G-code tokenizer factory: `'standalone'` backs `gcode`,
  `'embedded'` is spliced into `klipper-config` values (Jinja caveats are commented there)
- `klipper-config` treats options whose name **ends in** `gcode` as G-code templates —
  `gcode_id`, `gcode_x_offset` merely start with it and stay plain
- Any new Jinja token type needs a colour in **both** editor themes in `setupMonaco.ts`
- CodeLens, document symbol and folding providers each run in their own Web Worker
- Tokenizer specs live in `src/monaco/language/__tests__/` and use `tokenize-helper.ts`
  (`registerLanguage`, `tokenizeLines`, `tokenBuilder`)
