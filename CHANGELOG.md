# Changelog

## 0.1.0 (2026-03-10)

Initial release of spectra — a unified, zero-dependency terminal styling library that replaces the fragmented chalk ecosystem.

### Features

- **Core Styling API** — chalk-compatible chaining interface (`spectra.red.bold('text')`)
- **Dynamic Colors** — hex, RGB, HSL, HSV, HWB, and ANSI256 support for foreground and background
- **Template Literals** — `spectra.template('{red Error:} {bold message}')`
- **Color Level Control** — force or detect color support levels (0–3)
- **Nesting** — nested styles with correct ANSI reset handling
- **ANSI Strip** (`spectra/strip`) — `strip()`, `hasAnsi()`, `ansiRegex()` (replaces strip-ansi, ansi-regex, has-ansi)
- **Terminal Detection** (`spectra/detect`) — `detectColors()`, `colorLevel()`, `supportsHyperlinks()` (replaces supports-color, supports-hyperlinks)
- **Word Wrap** (`spectra/wrap`) — `wrapAnsi()`, `sliceAnsi()`, `truncateAnsi()` (replaces wrap-ansi, slice-ansi)
- **Color Conversion** (`spectra/convert`) — full color space engine across 9 spaces with 148 CSS named colors (replaces color-convert, color-name)
- **Migration Codemod** — jscodeshift transform for automated `chalk` → `spectra` migration
- **TypeScript-first** — full type exports, ESM primary with subpath exports

### Quality

- 336 tests across 8 test files
- 104 chalk compatibility tests
- Performance benchmarks vs chalk, picocolors, yoctocolors

### Packages Replaced

`chalk`, `ansi-styles`, `supports-color`, `strip-ansi`, `ansi-regex`, `wrap-ansi`, `slice-ansi`, `color-convert`, `color-name`, `has-ansi`, `supports-hyperlinks`
