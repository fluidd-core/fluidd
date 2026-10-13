# Source of muon-link-web

Fluidd bundles this browser client into hashed `/assets/` files. It loads the JavaScript on demand and gives
the initializer the hashed WASM URL. The one-release console fallback is `ALLOW_CONSOLE_CLIENT_FALLBACK` in `iroh.ts`.

Source: https://github.com/Muon-3D/muon-link, crate `crates/muon-link-web`, commit `d71dbe195e2174307cc25751dd1c300bd32e67b6`.
Built from that clean checkout with the Muon3D Slicer's `scripts/build-muon-link-web.mjs`, which supplies the
Zig C compiler wrapper, remaps build paths, checks the output for local paths, and generates third-party notices.
This pin includes browser Bluetooth (`MuonEndpoint.addLink`) as well as relay access.

Toolchain: rustc 1.97.1 (8bab26f4f 2026-07-14); cargo 1.97.1 (c980f4866 2026-06-30);
wasm-bindgen 0.2.127; zig 0.13.0 (ziglang, -target wasm32-freestanding).

```sh
rustup target add wasm32-unknown-unknown  # toolchain 1.97.1 (rust-toolchain.toml)
CC_wasm32_unknown_unknown="zig cc -target wasm32-freestanding, --target=* dropped"  AR_wasm32_unknown_unknown="zig ar"  # ziglang 0.13.0
CARGO_ENCODED_RUSTFLAGS="--remap-path-prefix=$CARGO_HOME=/cargo --remap-path-prefix=<muon-link checkout>=/muon-link --remap-path-prefix=$(rustc --print sysroot)=/rustc"  # separated by 0x1f, the longest folder last
cargo build --release --target wasm32-unknown-unknown -p muon-link-web --locked
wasm-bindgen --target web --out-dir pkg --out-name muon_link_web target/wasm32-unknown-unknown/release/muon_link_web.wasm
```

The build and Vitest verify every file against `muon-link-web.lock.json`. To update the pin, build a clean
source commit with the matching toolchain, copy the glue, WASM and licence notices, record their SHA-256 hashes,
and update the two imports in `iroh.ts` and the module path in `bundled-client.spec.ts`.
Vite emits the licence notices under `/licenses/muon-link-web/d71dbe1/`.
