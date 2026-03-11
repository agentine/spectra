# spectra

**A unified, zero-dependency terminal styling library that replaces the fragmented chalk ecosystem.**

---

## Target

The chalk ecosystem on npm — a cluster of 15+ interdependent packages for terminal string styling, collectively downloaded **2 billion+ times per week**, maintained by **1–2 individuals**, and **already compromised once** in the September 2025 supply chain attack.

### Packages Replaced

| Package | Weekly Downloads | Function |
|---------|-----------------|----------|
| `chalk` | ~290M | Terminal string styling API |
| `ansi-styles` | ~250M | ANSI escape code constants |
| `supports-color` | ~200M | Detect terminal color support |
| `strip-ansi` | ~180M | Remove ANSI escape codes from strings |
| `ansi-regex` | ~180M | Regex matching ANSI escape codes |
| `wrap-ansi` | ~100M | Word-wrap strings containing ANSI codes |
| `slice-ansi` | ~30M | Slice strings containing ANSI codes |
| `color-convert` | ~150M | Convert between color spaces (RGB, HSL, HWB, etc.) |
| `color-name` | ~150M | Map CSS color names to RGB values |
| `has-ansi` | ~5M | Check if string contains ANSI codes |
| `supports-hyperlinks` | ~10M | Detect terminal hyperlink support |

### Why This Target

1. **Bus factor = 1.** The September 2025 attack phished a single maintainer and compromised 18 packages simultaneously. Malicious versions with crypto-stealing code were live for ~2 hours before removal.
2. **Fragmentation is the vulnerability.** 15+ tiny packages means 15+ npm accounts to secure, 15+ publish pipelines, 15+ potential attack surfaces. One phished credential cascades everywhere.
3. **No full replacement exists.** Alternatives like `picocolors` and `yoctocolors` intentionally sacrifice features (no hex colors, no 256-color, no wrapping, no stripping). They're fine for simple use cases but don't replace the full chalk stack that large projects depend on.
4. **Consolidation is the fix.** One package, one codebase, one publish pipeline, one audit surface. The security benefit alone justifies the project.

---

## Scope

### In Scope

- Full chalk API compatibility (styles, colors, 256-color, truecolor, hex, RGB, HSL)
- ANSI escape code generation and parsing
- Terminal capability detection (color level, hyperlinks)
- String manipulation with ANSI awareness (strip, wrap, slice, truncate)
- Color space conversions (RGB, HSL, HSV, HWB, CMYK, CSS keywords)
- TypeScript-first with full type exports
- ESM primary with CJS compatibility
- Migration guide and chalk compatibility layer
- Comprehensive test suite (>95% coverage)

### Out of Scope

- Browser-specific APIs (this is a terminal library)
- Logging framework features (that's `debug`, `pino`, etc.)
- CLI framework features (argument parsing, prompts, spinners)

---

## Architecture

### Single Package, Zero Dependencies

```
spectra/
├── src/
│   ├── index.ts          # Main API — chalk-compatible styling interface
│   ├── styles.ts         # ANSI escape code generation (replaces ansi-styles)
│   ├── detect.ts         # Terminal capability detection (replaces supports-color)
│   ├── strip.ts          # Strip ANSI codes (replaces strip-ansi, ansi-regex, has-ansi)
│   ├── wrap.ts           # Word-wrap with ANSI (replaces wrap-ansi, slice-ansi)
│   ├── convert.ts        # Color space conversions (replaces color-convert, color-name)
│   └── color-names.ts    # CSS color name → RGB map (replaces color-name)
├── tests/
│   ├── styles.test.ts
│   ├── detect.test.ts
│   ├── strip.test.ts
│   ├── wrap.test.ts
│   ├── convert.test.ts
│   └── compat.test.ts   # Chalk API compatibility tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── PLAN.md
├── README.md
└── LICENSE               # MIT
```

### Module Exports

The package exposes subpath exports so consumers can import only what they need:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./styles": "./dist/styles.js",
    "./detect": "./dist/detect.js",
    "./strip": "./dist/strip.js",
    "./wrap": "./dist/wrap.js",
    "./convert": "./dist/convert.js"
  }
}
```

### API Design

#### Main API (chalk replacement)

```typescript
import spectra from 'spectra';

// Chained styling — identical to chalk
spectra.red.bold('Error!');
spectra.hex('#ff6600').bgBlue('Warning');
spectra.rgb(255, 136, 0).underline('Notice');
spectra.hsl(32, 100, 50)('Custom');

// Nesting
spectra.red(`Error: ${spectra.bold('critical')} failure`);

// Template literal support
spectra.template('{red Error:} {bold.yellow critical} failure');
```

#### Strip (strip-ansi + ansi-regex replacement)

```typescript
import { strip, hasAnsi, ansiRegex } from 'spectra/strip';

strip('\u001b[31mhello\u001b[39m');  // 'hello'
hasAnsi('\u001b[31mhello\u001b[39m'); // true
```

#### Detect (supports-color replacement)

```typescript
import { detectColors, colorLevel } from 'spectra/detect';

detectColors();        // { level: 3, has256: true, has16m: true }
colorLevel(stream);    // 0 | 1 | 2 | 3
```

#### Wrap (wrap-ansi + slice-ansi replacement)

```typescript
import { wrapAnsi, sliceAnsi, truncateAnsi } from 'spectra/wrap';

wrapAnsi(styledString, 40);           // word-wrap at column 40
sliceAnsi(styledString, 5, 15);       // slice preserving ANSI
truncateAnsi(styledString, 20, '…');  // truncate with ellipsis
```

#### Convert (color-convert replacement)

```typescript
import { convert } from 'spectra/convert';

convert.rgb.hsl(255, 136, 0);    // [32, 100, 50]
convert.hex.rgb('#ff8800');       // [255, 136, 0]
convert.keyword.rgb('tomato');    // [255, 99, 71]
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Zero dependencies | Eliminates transitive supply chain risk entirely. Every line of code is auditable in one repo. |
| TypeScript-first | Full type safety, better IDE experience, catches bugs at compile time. |
| ESM primary + CJS shim | Modern default, but can't break the millions of CJS consumers. |
| Chalk-compatible API | Migration must be trivial. `s/chalk/spectra/g` should work for 95% of use cases. |
| Subpath exports | Tree-shaking friendly. Use `spectra/strip` without pulling in color conversion. |
| Vitest for testing | Fast, TypeScript-native, modern. |
| MIT license | Maximum adoption, same as chalk. |

---

## Deliverables

1. **`spectra` npm package** — fully functional, published, zero-dependency
2. **README.md** — usage docs, migration guide from chalk, API reference
3. **Test suite** — >95% coverage, including chalk compatibility tests
4. **Benchmark** — performance comparison against chalk, picocolors, yoctocolors
5. **Migration codemod** — optional jscodeshift transform: `chalk` → `spectra`

---

## Implementation Phases

### Phase 1: Core Styling
- `styles.ts` — ANSI escape code generation
- `detect.ts` — terminal color detection
- `index.ts` — main chalk-compatible API
- Basic test suite

### Phase 2: String Utilities
- `strip.ts` — strip/detect ANSI codes
- `wrap.ts` — word-wrap and slice with ANSI awareness
- Tests for string utilities

### Phase 3: Color Conversion
- `convert.ts` — full color space conversion engine
- `color-names.ts` — CSS keyword mappings
- Integration with main API (hex, rgb, hsl methods)

### Phase 4: Polish & Ship
- Chalk compatibility test suite (test against chalk's own test cases)
- Performance benchmarks
- README and migration guide
- npm publish setup (provenance, 2FA, multiple maintainers)
- Migration codemod
