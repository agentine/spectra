/**
 * Performance benchmarks: spectra vs chalk vs picocolors vs yoctocolors
 *
 * Run: npx vitest bench benchmarks/bench.ts
 */

import { bench, describe } from 'vitest';

import spectra from '../src/index.js';
import chalk from 'chalk';
import pc from 'picocolors';
import yc from 'yoctocolors';

import { strip } from '../src/strip.js';
import { wrapAnsi } from '../src/wrap.js';
import { convert } from '../src/convert.js';
import { hexToRgb } from '../src/styles.js';

// Force level 3 for consistent results
spectra.level = 3;
chalk.level = 3;

// ─── 1. Simple styling ───────────────────────────

describe('Simple styling: .red("text")', () => {
  bench('spectra', () => {
    spectra.red('Hello, World!');
  });

  bench('chalk', () => {
    chalk.red('Hello, World!');
  });

  bench('picocolors', () => {
    pc.red('Hello, World!');
  });

  bench('yoctocolors', () => {
    yc.red('Hello, World!');
  });
});

// ─── 2. Chained styling ─────────────────────────

describe('Chained styling: .red.bold.underline("text")', () => {
  bench('spectra', () => {
    spectra.red.bold.underline('Hello, World!');
  });

  bench('chalk', () => {
    chalk.red.bold.underline('Hello, World!');
  });

  // picocolors and yoctocolors don't support chaining — use composition
  bench('picocolors (composed)', () => {
    pc.red(pc.bold(pc.underline('Hello, World!')));
  });

  bench('yoctocolors (composed)', () => {
    yc.red(yc.bold(yc.underline('Hello, World!')));
  });
});

// ─── 3. Nested styling ──────────────────────────

describe('Nested styling: .red("a " + .blue("b") + " c")', () => {
  bench('spectra', () => {
    spectra.red('a ' + spectra.blue('b') + ' c');
  });

  bench('chalk', () => {
    chalk.red('a ' + chalk.blue('b') + ' c');
  });

  bench('picocolors (composed)', () => {
    pc.red('a ' + pc.blue('b') + ' c');
  });

  bench('yoctocolors (composed)', () => {
    yc.red('a ' + yc.blue('b') + ' c');
  });
});

// ─── 4. Hex/RGB color ───────────────────────────

describe('Hex color: .hex("#ff6600")("text")', () => {
  bench('spectra', () => {
    spectra.hex('#ff6600')('Hello, World!');
  });

  bench('chalk', () => {
    chalk.hex('#ff6600')('Hello, World!');
  });

  // picocolors and yoctocolors don't support hex colors
});

describe('RGB color: .rgb(255, 136, 0)("text")', () => {
  bench('spectra', () => {
    spectra.rgb(255, 136, 0)('Hello, World!');
  });

  bench('chalk', () => {
    chalk.rgb(255, 136, 0)('Hello, World!');
  });
});

// ─── 5. Strip ANSI ──────────────────────────────

const styledString = spectra.red.bold('Error: ') + spectra.yellow('something went wrong') + ' ' + spectra.dim('at line 42');

describe('Strip ANSI codes', () => {
  bench('spectra strip()', () => {
    strip(styledString);
  });

  // chalk uses strip-ansi separately, but we benchmark our own implementation
});

// ─── 6. Wrap ANSI ───────────────────────────────

const longStyled = spectra.red('The quick brown fox jumps over the lazy dog. ') +
  spectra.blue('Pack my box with five dozen liquor jugs. ') +
  spectra.green('How vexingly quick daft zebras jump.');

describe('Wrap ANSI at column 40', () => {
  bench('spectra wrapAnsi()', () => {
    wrapAnsi(longStyled, 40);
  });
});

// ─── 7. Color conversion ────────────────────────

describe('Color conversion: rgb→hsl', () => {
  bench('spectra convert.rgb.hsl()', () => {
    convert.rgb.hsl(255, 136, 0);
  });
});

describe('Color conversion: hex→rgb', () => {
  bench('spectra hexToRgb()', () => {
    hexToRgb('#ff6600');
  });
});
