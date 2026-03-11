/**
 * jscodeshift codemod: chalk → spectra
 *
 * Transforms:
 * - import chalk from "chalk"           → import spectra from "spectra"
 * - import chalk from "chalk/..."       → import spectra from "spectra/..."
 * - import { ... } from "chalk/..."     → import { ... } from "spectra/..."
 * - const chalk = require("chalk")      → const spectra = require("spectra")
 * - const chalk = require("chalk/...")   → const spectra = require("spectra/...")
 * - All chalk.xxx references            → spectra.xxx
 * - All chalk(...) calls                → spectra(...)
 *
 * Usage:
 *   npx jscodeshift -t codemods/chalk-to-spectra.ts src/**\/*.ts
 */

// jscodeshift types — declared inline to avoid requiring @types/jscodeshift as a dep
interface FileInfo { source: string; path: string }
interface API { jscodeshift: any }
type Options = Record<string, unknown>;

// Subpath mapping: chalk subpaths → spectra subpaths
const SUBPATH_MAP: Record<string, string> = {
  'chalk': 'spectra',
  'chalk/ansi-styles': 'spectra/styles',
  'chalk/supports-color': 'spectra/detect',
};

function mapSource(source: string): string {
  // Exact match
  if (source in SUBPATH_MAP) return SUBPATH_MAP[source];
  // Prefix match for any chalk/ subpath
  if (source.startsWith('chalk/')) return 'spectra/' + source.slice(6);
  return source;
}

export default function transform(
  file: FileInfo,
  api: API,
  _options: Options,
) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let hasChanges = false;

  // Track all local binding names that came from chalk imports/requires
  const chalkBindings = new Set<string>();

  // ─── 1. ESM imports ────────────────────────────
  // import chalk from "chalk"
  // import { something } from "chalk/..."
  // import * as chalk from "chalk"
  root
    .find(j.ImportDeclaration)
    .filter((path) => {
      const src = path.node.source.value;
      return typeof src === 'string' && (src === 'chalk' || src.startsWith('chalk/'));
    })
    .forEach((path) => {
      const oldSource = path.node.source.value as string;
      const newSource = mapSource(oldSource);
      path.node.source = j.literal(newSource);
      hasChanges = true;

      // Track binding names for default and namespace imports
      for (const specifier of path.node.specifiers ?? []) {
        if (
          specifier.type === 'ImportDefaultSpecifier' ||
          specifier.type === 'ImportNamespaceSpecifier'
        ) {
          const localName = specifier.local?.name;
          if (localName === 'chalk') {
            specifier.local = j.identifier('spectra');
            chalkBindings.add('spectra');
          } else if (localName) {
            chalkBindings.add(localName);
          }
        }
        // Named imports: don't rename the local binding, just the source was changed
      }
    });

  // ─── 2. CJS require ───────────────────────────
  // const chalk = require("chalk")
  // const { something } = require("chalk/...")
  root
    .find(j.CallExpression, { callee: { name: 'require' } })
    .filter((path) => {
      const args = path.node.arguments;
      if (args.length !== 1) return false;
      const arg = args[0];
      if (arg.type !== 'StringLiteral' && arg.type !== 'Literal') return false;
      const value = 'value' in arg ? arg.value : undefined;
      return typeof value === 'string' && (value === 'chalk' || value.startsWith('chalk/'));
    })
    .forEach((path) => {
      const arg = path.node.arguments[0];
      const oldSource = ('value' in arg ? arg.value : '') as string;
      const newSource = mapSource(oldSource);

      path.node.arguments[0] = j.literal(newSource);
      hasChanges = true;

      // Track the binding: const chalk = require("chalk")
      const parent = path.parent?.node;
      if (parent?.type === 'VariableDeclarator') {
        const id = parent.id;
        if (id.type === 'Identifier' && id.name === 'chalk') {
          id.name = 'spectra';
          chalkBindings.add('spectra');
        } else if (id.type === 'Identifier') {
          chalkBindings.add(id.name);
        }
      }
    });

  // ─── 3. Rename chalk references ───────────────
  // chalk.red(...) → spectra.red(...)
  // chalk(...) → spectra(...)
  root
    .find(j.Identifier, { name: 'chalk' })
    .forEach((path) => {
      // Skip import/require source strings (already handled)
      const parent = path.parent?.node;
      if (parent?.type === 'ImportDeclaration') return;
      if (parent?.type === 'ImportDefaultSpecifier') return;
      if (parent?.type === 'ImportNamespaceSpecifier') return;

      // Skip property keys: { chalk: ... }
      if (parent?.type === 'Property' && parent.key === path.node && !parent.computed) return;
      // Skip member property access: obj.chalk (where chalk is the property, not the object)
      if (parent?.type === 'MemberExpression' && parent.property === path.node && !parent.computed) return;

      path.node.name = 'spectra';
      hasChanges = true;
    });

  return hasChanges ? root.toSource() : undefined;
}
