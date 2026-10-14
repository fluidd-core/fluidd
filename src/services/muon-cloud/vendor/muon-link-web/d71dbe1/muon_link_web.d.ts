/* tslint:disable */
/* eslint-disable */
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */

export type ReadableStreamType = "bytes";

/**
 * One Web Bluetooth connection, joined to the page's endpoint.
 */
export class BleLink {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Queues `BYE`; keep pumping until `nextSegment` gives `undefined`.
     */
    close(): void;
    /**
     * Resolves with why the link closed.
     */
    closed(): Promise<any>;
    /**
     * Resolves to the printer's claimed id once `HELLO` completes.
     */
    connected(): Promise<any>;
    /**
     * `{ id, role, state, segmentSize, remoteId?, closeReason? }`.
     */
    info(): any;
    /**
     * True once the final `BYE` has been handed out.
     */
    isClosed(): boolean;
    /**
     * The next segment to write to `RX`, or `undefined` once closed and
     * drained.
     */
    nextSegment(): Promise<any>;
    /**
     * The GATT connection is gone.
     */
    onDisconnected(): void;
    /**
     * A `TX` notification's bytes, in order.
     */
    onSegment(segment: Uint8Array): void;
    /**
     * Re-sends `HELLO` while the handshake is pending.
     */
    retryHandshake(): boolean;
    /**
     * Calls `callback` when segments become available (edge-triggered), for a
     * callback-driven driver. `undefined` removes it.
     */
    setTransmitNotify(callback?: Function | null): void;
    /**
     * The next segment if one is ready, else `undefined`.
     */
    tryNextSegment(): Uint8Array | undefined;
    /**
     * Unique per endpoint.
     */
    readonly id: number;
    /**
     * The printer's claimed id once connected.
     */
    readonly remoteId: string | undefined;
    /**
     * Always `"central"` in a browser.
     */
    readonly role: string;
}

export class IntoUnderlyingByteSource {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    cancel(): void;
    pull(controller: ReadableByteStreamController): Promise<any>;
    start(controller: ReadableByteStreamController): void;
    readonly autoAllocateChunkSize: number;
    readonly type: ReadableStreamType;
}

export class IntoUnderlyingSink {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    abort(reason: any): Promise<any>;
    close(): Promise<any>;
    write(chunk: any): Promise<any>;
}

export class IntoUnderlyingSource {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    cancel(): void;
    pull(controller: ReadableStreamDefaultController): Promise<any>;
}

/**
 * An Iroh endpoint that reaches printers through one relay.
 */
export class MuonEndpoint {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Hands a Web Bluetooth GATT connection to this endpoint, once `TX`
     * notifications are on. `role` must be `"central"`; `maxSegment` is the
     * printer's `INFO.maxSegment` (Web Bluetooth cannot read the MTU), or
     * `undefined`/0 if unknown. The same signature as Iroh_BLE's
     * `BleNode.addLink`, which its `blelink-web.js` driver calls.
     *
     * # Errors
     *
     * A `config` error for any role but `"central"` or a bad `maxSegment`.
     */
    addLink(role: string, maxSegment?: number | null): BleLink;
    /**
     * Starts the `SEC-7` ceremony with `printer_id`, and resolves once the
     * comparison value is known. A window must be open at the panel.
     */
    beginPairing(printer_id: string, label: string): Promise<any>;
    /**
     * Closes the endpoint and every connection on it.
     */
    close(): Promise<any>;
    /**
     * Dials `printer_id` on the gateway protocol through the relay.
     *
     * Resolves once the handshake completes, which is not an admission. An
     * unpaired key finds out on its first request.
     */
    connect(printer_id: string): Promise<any>;
    /**
     * Binds an endpoint that uses `relay_url` and nothing else.
     *
     * `secret` is the 32 bytes [`MuonEndpoint::secret_key`] returned last
     * time, or `null` for a new key.
     */
    static create(relay_url: string, secret?: Uint8Array | null): Promise<any>;
    /**
     * This endpoint's id: what the printer's panel shows beside a pairing.
     */
    endpointId(): string;
    /**
     * The private key, so the page can bind the same identity next time.
     */
    secretKey(): Uint8Array;
}

/**
 * A pairing at the code step.
 */
export class Pairing {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The six symbols to show. The person checks the panel shows the same.
     */
    comparison(): string;
    /**
     * Sends the eight digits from the panel, then waits for the owner.
     *
     * Resolves to `{ fingerprint, role }`. A wrong code rejects with kind
     * `"code-rejected"` and `attemptsRemaining`, and this object stays usable.
     */
    submitCode(code: number): Promise<any>;
}

/**
 * One printer, over one connection.
 */
export class PrinterSession {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Closes the connection.
     */
    close(): void;
    /**
     * `SEC-7`'s comparison value of this session's connection, grouped as
     * `F6Q TDH` (ADR 0032 D7). The printer shows the same six symbols for the
     * same connection; a page setting a printer up over Web Bluetooth shows
     * this and has the person confirm the two match before it sends anything.
     */
    comparison(): string;
    /**
     * One HTTP request on its own stream.
     *
     * `headers` is a flat list, `[name, value, name, value, ...]`. Resolves
     * to `{ status, headers, body }`, with `headers` in the same flat shape and
     * `body` a `Uint8Array`. A policy `403` resolves; it is not a rejection.
     */
    fetch(method: string, path: string, headers: string[], body: Uint8Array): Promise<any>;
    /**
     * Upgrades `path` to a WebSocket.
     */
    openWebSocket(path: string): Promise<any>;
    /**
     * The printer's EndpointId, as the handshake proved it.
     */
    printerId(): string;
}

/**
 * A WebSocket to the printer's Moonraker, through the gateway.
 */
export class Socket {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Sends a normal close.
     */
    close(): Promise<any>;
    /**
     * The next message: a string for text, a `Uint8Array` for binary, or
     * `null` once the socket has closed. A close carries no payload here; the
     * caller learns the reason from the rejected promise or the `null`.
     */
    next(): Promise<any>;
    /**
     * Sends one text message.
     */
    send(text: string): Promise<any>;
}

/**
 * Decodes an `INFO` value: `{ version, caps, psm, maxSegment, endpointId,
 * l2cap, writeWithResponse }`. `maxSegment` 0 means unknown.
 *
 * # Errors
 *
 * A `config` error for bytes that are not an Iroh_BLE `INFO` value.
 */
export function decodeInfo(bytes: Uint8Array): any;

/**
 * The GATT identifiers: `{ service, info, rx, tx }`.
 */
export function uuids(): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_blelink_free: (a: number, b: number) => void;
    readonly __wbg_muonendpoint_free: (a: number, b: number) => void;
    readonly __wbg_pairing_free: (a: number, b: number) => void;
    readonly __wbg_printersession_free: (a: number, b: number) => void;
    readonly __wbg_socket_free: (a: number, b: number) => void;
    readonly blelink_close: (a: number) => void;
    readonly blelink_closed: (a: number) => number;
    readonly blelink_connected: (a: number) => number;
    readonly blelink_id: (a: number) => number;
    readonly blelink_info: (a: number) => number;
    readonly blelink_isClosed: (a: number) => number;
    readonly blelink_nextSegment: (a: number) => number;
    readonly blelink_onDisconnected: (a: number) => void;
    readonly blelink_onSegment: (a: number, b: number, c: number) => void;
    readonly blelink_remoteId: (a: number, b: number) => void;
    readonly blelink_retryHandshake: (a: number) => number;
    readonly blelink_role: (a: number, b: number) => void;
    readonly blelink_setTransmitNotify: (a: number, b: number) => void;
    readonly blelink_tryNextSegment: (a: number, b: number) => void;
    readonly decodeInfo: (a: number, b: number, c: number) => void;
    readonly muonendpoint_addLink: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly muonendpoint_beginPairing: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly muonendpoint_close: (a: number) => number;
    readonly muonendpoint_connect: (a: number, b: number, c: number) => number;
    readonly muonendpoint_create: (a: number, b: number, c: number, d: number) => number;
    readonly muonendpoint_endpointId: (a: number, b: number) => void;
    readonly muonendpoint_secretKey: (a: number, b: number) => void;
    readonly pairing_comparison: (a: number, b: number) => void;
    readonly pairing_submitCode: (a: number, b: number) => number;
    readonly printersession_close: (a: number) => void;
    readonly printersession_comparison: (a: number, b: number) => void;
    readonly printersession_fetch: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => number;
    readonly printersession_openWebSocket: (a: number, b: number, c: number) => number;
    readonly printersession_printerId: (a: number, b: number) => void;
    readonly socket_close: (a: number) => number;
    readonly socket_next: (a: number) => number;
    readonly socket_send: (a: number, b: number, c: number) => number;
    readonly uuids: () => number;
    readonly __wbg_intounderlyingbytesource_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingsink_free: (a: number, b: number) => void;
    readonly __wbg_intounderlyingsource_free: (a: number, b: number) => void;
    readonly intounderlyingbytesource_autoAllocateChunkSize: (a: number) => number;
    readonly intounderlyingbytesource_cancel: (a: number) => void;
    readonly intounderlyingbytesource_pull: (a: number, b: number) => number;
    readonly intounderlyingbytesource_start: (a: number, b: number) => void;
    readonly intounderlyingbytesource_type: (a: number) => number;
    readonly intounderlyingsink_abort: (a: number, b: number) => number;
    readonly intounderlyingsink_close: (a: number) => number;
    readonly intounderlyingsink_write: (a: number, b: number) => number;
    readonly intounderlyingsource_cancel: (a: number) => void;
    readonly intounderlyingsource_pull: (a: number, b: number) => number;
    readonly ring_core_0_17_14__bn_mul_mont: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly __wasm_bindgen_func_elem_9543: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_9545: (a: number, b: number, c: number, d: number) => void;
    readonly __wasm_bindgen_func_elem_3901: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_2162: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_4681: (a: number, b: number, c: number) => void;
    readonly __wasm_bindgen_func_elem_3767: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_4099: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_4136: (a: number, b: number) => void;
    readonly __wasm_bindgen_func_elem_9441: (a: number, b: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number) => void;
    readonly __wbindgen_export4: (a: number, b: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export5: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
