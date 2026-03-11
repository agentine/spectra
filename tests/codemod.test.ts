/**
 * Tests for the chalk-to-spectra jscodeshift codemod.
 *
 * These tests actually invoke the transform function via jscodeshift,
 * verifying that chalk code is correctly rewritten to spectra.
 */

import { describe, it, expect } from 'vitest';
import jscodeshift from 'jscodeshift';
import transform from '../codemods/chalk-to-spectra.js';

function applyTransform(input: string): string {
  const result = transform(
    { source: input, path: 'test.ts' },
    { jscodeshift },
    {},
  );
  // transform returns undefined if no changes; return original in that case
  return result ?? input;
}

describe('chalk-to-spectra codemod', () => {
  const transforms: Array<{ name: string; input: string; expected: string }> = [
    {
      name: 'ESM default import',
      input: 'import chalk from "chalk";',
      expected: 'import spectra from "spectra";',
    },
    {
      name: 'ESM default import with usage',
      input: [
        'import chalk from "chalk";',
        'console.log(chalk.red("hello"));',
      ].join('\n'),
      expected: [
        'import spectra from "spectra";',
        'console.log(spectra.red("hello"));',
      ].join('\n'),
    },
    {
      name: 'CJS require',
      input: 'const chalk = require("chalk");',
      expected: 'const spectra = require("spectra");',
    },
    {
      name: 'CJS require with usage',
      input: [
        'const chalk = require("chalk");',
        'chalk.bold.red("error");',
      ].join('\n'),
      expected: [
        'const spectra = require("spectra");',
        'spectra.bold.red("error");',
      ].join('\n'),
    },
    {
      name: 'Subpath import: chalk/ansi-styles → spectra/styles',
      input: 'import styles from "chalk/ansi-styles";',
      expected: 'import styles from "spectra/styles";',
    },
    {
      name: 'Subpath import: chalk/supports-color → spectra/detect',
      input: 'import { supportsColor } from "chalk/supports-color";',
      expected: 'import { supportsColor } from "spectra/detect";',
    },
    {
      name: 'Named import from chalk subpath',
      input: 'import { something } from "chalk/other";',
      expected: 'import { something } from "spectra/other";',
    },
    {
      name: 'Multiple chalk references',
      input: [
        'import chalk from "chalk";',
        'const a = chalk.red("a");',
        'const b = chalk.bold.blue("b");',
        'const c = chalk("c");',
      ].join('\n'),
      expected: [
        'import spectra from "spectra";',
        'const a = spectra.red("a");',
        'const b = spectra.bold.blue("b");',
        'const c = spectra("c");',
      ].join('\n'),
    },
    {
      name: 'chalk.level property access',
      input: [
        'import chalk from "chalk";',
        'chalk.level = 0;',
        'console.log(chalk.level);',
      ].join('\n'),
      expected: [
        'import spectra from "spectra";',
        'spectra.level = 0;',
        'console.log(spectra.level);',
      ].join('\n'),
    },
    {
      name: 'Template literal usage',
      input: [
        'import chalk from "chalk";',
        'console.log(`${chalk.red("error")}: ${chalk.dim(msg)}`);',
      ].join('\n'),
      expected: [
        'import spectra from "spectra";',
        'console.log(`${spectra.red("error")}: ${spectra.dim(msg)}`);',
      ].join('\n'),
    },
    {
      name: 'Stored style instance',
      input: [
        'import chalk from "chalk";',
        'const error = chalk.bold.red;',
        'const warning = chalk.bold.yellow;',
        'error("fail");',
      ].join('\n'),
      expected: [
        'import spectra from "spectra";',
        'const error = spectra.bold.red;',
        'const warning = spectra.bold.yellow;',
        'error("fail");',
      ].join('\n'),
    },
  ];

  for (const { name, input, expected } of transforms) {
    it(`transforms: ${name}`, () => {
      const result = applyTransform(input);
      expect(result).toBe(expected);
    });
  }

  it('does not transform non-chalk imports', () => {
    const input = 'import picocolors from "picocolors";';
    const result = applyTransform(input);
    expect(result).toBe(input);
  });

  it('returns undefined (no changes) for non-chalk code', () => {
    const input = 'const x = 1;';
    const result = transform(
      { source: input, path: 'test.ts' },
      { jscodeshift },
      {},
    );
    expect(result).toBeUndefined();
  });
});
