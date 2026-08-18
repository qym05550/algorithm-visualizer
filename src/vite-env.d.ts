/// <reference types="vite/client" />

/** Injected at build time by vite.config.ts's `define`, sourced from
 *  package.json's "version" field — the single canonical source of the
 *  application version (Version Badge task). Never hardcode a version
 *  string elsewhere; always read this constant instead. */
declare const __APP_VERSION__: string
