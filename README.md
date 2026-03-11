# spectra

A unified, zero-dependency terminal styling library that replaces the fragmented chalk ecosystem.

One package. One audit surface. Full chalk compatibility.

## Why spectra?

The chalk ecosystem spans 15+ interdependent packages collectively downloaded **2 billion+ times per week**, maintained by 1-2 individuals. In September 2025, a single phished maintainer credential compromised 18 packages simultaneously, injecting crypto-stealing code into millions of installs.

**spectra consolidates the entire chalk stack into a single zero-dependency package:**

| What you get | What it replaces |
|---|---|
| `spectra` (main API) | `chalk`, `ansi-styles` |
| `spectra/strip` | `strip-ansi`, `ansi-regex`, `has-ansi` |
| `spectra/detect` | `supports-color`, `supports-hyperlinks` |
| `spectra/wrap` | `wrap-ansi`, `slice-ansi` |
| `spectra/convert` | `color-convert`, `color-name` |

One codebase, one publish pipeline, one audit surface. The security benefit alone justifies the switch.

## Install

```sh
npm install spectra
```

## Quick start

```typescript
import spectra from 'spectra';

// Basic styling
spectra.red('Error!');
spectra.bold.green('Success!');
spectra.yellow.underline('Warning');

// Hex, RGB, HSL colors
spectra.hex('#ff6600')('Orange text');
spectra.rgb(255, 136, 0).bold('Also orange');
spectra.hsl(32, 100, 50)('Still orange');

// Background colors
spectra.bgRed.white.bold(' ERROR ');
spectra.bgHex('#663399')(' Purple background ');

// Nesting
spectra.red(`Error: ${spectra.bold('critical')} failure`);

// Template syntax
spectra.template('{red Error:} {bold.yellow critical} failure');
```

## API Reference

### Main API

```typescript
import spectra from 'spectra';
```

#### Modifiers

`reset`, `bold`, `dim`, `italic`, `underline`, `inverse`, `hidden`, `strikethrough`, `overline`

```typescript
spectra.bold('Bold text');
spectra.italic.dim('Subtle');
```

#### Colors

**Foreground:** `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`

**Bright variants:** `blackBright`, `redBright`, `greenBright`, `yellowBright`, `blueBright`, `magentaBright`, `cyanBright`, `whiteBright`

**Aliases:** `gray`/`grey` (same as `blackBright`)

**Background:** All foreground colors are available as `bg*` variants — `bgRed`, `bgGreen`, `bgBlue`, `bgYellow`, `bgMagenta`, `bgCyan`, `bgWhite`, `bgBlack`, plus bright variants (`bgRedBright`, etc.) and aliases (`bgGray`/`bgGrey`).

```typescript
spectra.red.bgWhite('Red on white');
spectra.bgBlue.whiteBright.bold('Bold white on blue');
```

#### Chaining

All styles are chainable. Each property returns a new spectra instance with the added style:

```typescript
spectra.red.bold.underline('Styled text');
spectra.bgYellow.black.italic('Warning');
```

#### Dynamic colors

```typescript
// Foreground
spectra.hex('#ff6600')('Hex color');
spectra.hex('ff6600')('Also works without #');
spectra.rgb(255, 136, 0)('RGB color');
spectra.hsl(32, 100, 50)('HSL color');
spectra.hsv(32, 100, 100)('HSV color');
spectra.hwb(32, 0, 0)('HWB color');
spectra.ansi256(202)('256-color');

// Background
spectra.bgHex('#663399')('Hex background');
spectra.bgRgb(102, 51, 153)('RGB background');
spectra.bgHsl(270, 50, 40)('HSL background');
spectra.bgHsv(270, 67, 60)('HSV background');
spectra.bgHwb(270, 20, 40)('HWB background');
spectra.bgAnsi256(93)('256-color background');
```

Dynamic colors chain with static styles:

```typescript
spectra.hex('#ff6600').bold.underline('Orange, bold, underlined');
```

#### Template syntax

```typescript
spectra.template('{red Error:} {bold.yellow critical} failure');
spectra.template('{green.bold Success!} Operation complete.');
spectra.template('{bgRed.white  FAIL } Test did not pass.');
```

Styles are dot-separated within the braces. The content follows after a space.

#### Color level

spectra auto-detects your terminal's color support. You can override it:

```typescript
spectra.level = 0; // No colors (strips all styling)
spectra.level = 1; // Basic 16 colors
spectra.level = 2; // 256 colors
spectra.level = 3; // Truecolor (16 million colors)
```

Colors are automatically downgraded to match the terminal's capability. For example, `spectra.hex('#ff6600')` on a level 1 terminal emits the nearest basic ANSI color.

### spectra/strip

Strip, detect, and match ANSI escape codes.

```typescript
import { strip, hasAnsi, ansiRegex } from 'spectra/strip';

strip('\x1b[31mhello\x1b[39m');   // 'hello'
hasAnsi('\x1b[31mhello\x1b[39m'); // true
hasAnsi('plain text');             // false

const regex = ansiRegex();         // RegExp matching all ANSI sequences
```

Handles CSI sequences (colors/styles), OSC sequences (hyperlinks, terminal titles), and single-character escape sequences.

### spectra/detect

Detect terminal color support and hyperlink capability.

```typescript
import { detectColors, colorLevel, supportsHyperlinks } from 'spectra/detect';

detectColors();
// { level: 3, has256: true, has16m: true }

colorLevel(process.stdout);
// 0 | 1 | 2 | 3

supportsHyperlinks(process.stdout);
// true | false
```

Detection respects `FORCE_COLOR`, `NO_COLOR`, `--no-color`, `--color`, `COLORTERM`, and `TERM` environment variables. It recognizes Windows Terminal, iTerm, Apple Terminal, VS Code, WezTerm, CI providers (GitHub Actions, Travis, CircleCI, GitLab CI, etc.), and standard terminal emulators.

### spectra/wrap

ANSI-aware word wrapping, slicing, and truncation.

```typescript
import { wrapAnsi, sliceAnsi, truncateAnsi } from 'spectra/wrap';

// Word-wrap at column 40, preserving ANSI styles across line breaks
wrapAnsi(styledString, 40);

// Options
wrapAnsi(styledString, 40, {
  hard: true,       // Break words longer than column width (default: false)
  trim: false,      // Keep leading whitespace on wrapped lines (default: true)
  wordWrap: false,  // Disable word wrapping, only break at column (default: true)
});

// Slice by visible character position, preserving ANSI state
sliceAnsi(styledString, 5, 15);

// Truncate with optional ellipsis
truncateAnsi(styledString, 20, '…');
```

### spectra/convert

Convert between color spaces. Replaces the `color-convert` and `color-name` packages.

```typescript
import { convert } from 'spectra/convert';

// Structured API: convert.<from>.<to>(values)
convert.rgb.hsl(255, 136, 0);     // [32, 100, 50]
convert.rgb.hsv(255, 136, 0);     // [32, 100, 100]
convert.rgb.hwb(255, 136, 0);     // [32, 0, 0]
convert.rgb.cmyk(255, 136, 0);    // [0, 47, 100, 0]
convert.rgb.hex(255, 136, 0);     // '#ff8800'
convert.rgb.ansi256(255, 136, 0); // 214
convert.rgb.ansi16(255, 136, 0);  // 93

convert.hsl.rgb(32, 100, 50);     // [255, 136, 0]
convert.hsv.rgb(32, 100, 100);    // [255, 136, 0]
convert.hwb.rgb(32, 0, 0);        // [255, 136, 0]
convert.cmyk.rgb(0, 47, 100, 0);  // [255, 135, 0]
convert.hex.rgb('#ff8800');        // [255, 136, 0]
convert.ansi256.rgb(214);         // [255, 175, 0]
convert.ansi16.rgb(93);           // [255, 255, 0]
convert.keyword.rgb('tomato');     // [255, 99, 71]
```

All 148 CSS Color Level 4 named colors are supported via `convert.keyword.rgb()`.

Individual conversion functions are also exported for direct use:

```typescript
import { rgbToHsl, hslToRgb, hexToRgb, rgbToHex } from 'spectra/convert';

rgbToHsl(255, 136, 0);  // [32, 100, 50]
hslToRgb(32, 100, 50);  // [255, 136, 0]
```

## Migration from chalk

### Step 1: Install spectra

```sh
npm install spectra
npm uninstall chalk ansi-styles supports-color strip-ansi ansi-regex has-ansi wrap-ansi slice-ansi color-convert color-name
```

### Step 2: Update imports

For most projects, find and replace is all you need:

```diff
- import chalk from 'chalk';
+ import spectra from 'spectra';

- chalk.red.bold('Error!')
+ spectra.red.bold('Error!')
```

The API is designed so that `s/chalk/spectra/g` works for the main styling API.

For subpackages:

```diff
- import stripAnsi from 'strip-ansi';
- import { supportsColor } from 'supports-color';
- import wrapAnsi from 'wrap-ansi';
- import colorConvert from 'color-convert';
+ import { strip } from 'spectra/strip';
+ import { detectColors } from 'spectra/detect';
+ import { wrapAnsi } from 'spectra/wrap';
+ import { convert } from 'spectra/convert';
```

### Step 3: Automated migration (optional)

A jscodeshift codemod is included for automated migration:

```sh
npx jscodeshift -t node_modules/spectra/codemods/chalk-to-spectra.ts --parser=tsx src/
```

The codemod handles:
- Default, named, and namespace ESM imports
- CommonJS `require()` calls
- Subpath mapping (`chalk/ansi-styles` -> `spectra/styles`, `chalk/supports-color` -> `spectra/detect`)
- Renaming all `chalk` identifier references to `spectra`

### API equivalents

| chalk ecosystem | spectra |
|---|---|
| `chalk.red('text')` | `spectra.red('text')` |
| `chalk.hex('#ff6600')('text')` | `spectra.hex('#ff6600')('text')` |
| `chalk.rgb(255, 136, 0)('text')` | `spectra.rgb(255, 136, 0)('text')` |
| `chalk.level` | `spectra.level` |
| `stripAnsi(str)` | `strip(str)` from `spectra/strip` |
| `hasAnsi(str)` | `hasAnsi(str)` from `spectra/strip` |
| `ansiRegex()` | `ansiRegex()` from `spectra/strip` |
| `supportsColor.stdout` | `detectColors(process.stdout)` from `spectra/detect` |
| `wrapAnsi(str, cols)` | `wrapAnsi(str, cols)` from `spectra/wrap` |
| `colorConvert.rgb.hsl(r, g, b)` | `convert.rgb.hsl(r, g, b)` from `spectra/convert` |
| `colorName['tomato']` | `convert.keyword.rgb('tomato')` from `spectra/convert` |

### Known differences

- **ESM only.** spectra ships as ESM. If you need CJS, use dynamic `import()` or a bundler.
- **`supports-color` return shape.** chalk's `supports-color` returns `{ stdout: { level, hasBasic, has256, has16m } }`. spectra's `detectColors()` returns `{ level, has256, has16m }` directly — pass the stream as an argument instead.
- **Template syntax.** spectra's `spectra.template()` is a method, not a tagged template literal.

## Environment variables

| Variable | Effect |
|---|---|
| `FORCE_COLOR=0\|1\|2\|3` | Force a specific color level |
| `FORCE_COLOR=true` | Force level 1 |
| `FORCE_COLOR=false` | Disable colors |
| `NO_COLOR` | Disable colors ([no-color.org](https://no-color.org)) |
| `COLORTERM=truecolor` | Signal truecolor support |
| `FORCE_HYPERLINK=1` | Force hyperlink support detection |

CLI flags `--color` and `--no-color` are also respected.

## License

MIT
