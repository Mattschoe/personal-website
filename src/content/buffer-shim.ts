// gray-matter stashes an (unused) `orig` copy of each file via `Buffer.from()`
// and probes input with `Buffer.isBuffer()`. Node has `Buffer`; the browser —
// where vite-react-ssg re-runs this module during hydration — does not, so
// referencing it throws `ReferenceError: Buffer is not defined`.
//
// Our input is always a string and the `orig` value is never read, so a no-op
// stub is sufficient. Guarded so Node keeps its real Buffer at build time.
declare global {
  var Buffer: unknown;
}

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = {
    from: (value: string) => value,
    isBuffer: () => false,
  };
}

export {};
