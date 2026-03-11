// Terminal capability detection (replaces supports-color, supports-hyperlinks)

import { WriteStream } from 'node:tty';

export interface ColorSupport {
  level: 0 | 1 | 2 | 3;
  has256: boolean;
  has16m: boolean;
}

function envForceColor(): number | undefined {
  const force = process.env['FORCE_COLOR'];
  if (force === undefined) return undefined;
  if (force === 'true' || force === '') return 1;
  if (force === 'false') return 0;
  const n = parseInt(force, 10);
  if (n >= 0 && n <= 3) return n;
  return undefined;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(`--${flag}`) || process.argv.includes(`--${flag}=true`);
}

function streamIsTTY(stream?: { isTTY?: boolean }): boolean {
  return !!stream && !!stream.isTTY;
}

export function colorLevel(stream?: WriteStream | { isTTY?: boolean }): 0 | 1 | 2 | 3 {
  const env = process.env;

  // --no-color flag
  if (hasFlag('no-color') || hasFlag('no-colors')) return 0;

  // --color flag
  if (hasFlag('color') || hasFlag('colors')) return 1;

  // FORCE_COLOR env var takes precedence
  const forced = envForceColor();
  if (forced !== undefined) return Math.min(forced, 3) as 0 | 1 | 2 | 3;

  // NO_COLOR convention (https://no-color.org/)
  if ('NO_COLOR' in env) return 0;

  // Not a TTY and no forcing — no color
  if (!streamIsTTY(stream)) return 0;

  // Check for Windows Terminal / ConEmu / modern terminals
  if (env['WT_SESSION']) return 3;
  if (env['TERM_PROGRAM'] === 'iTerm.app') {
    const version = parseInt((env['TERM_PROGRAM_VERSION'] || '').split('.')[0], 10);
    return version >= 3 ? 3 : 2;
  }
  if (env['TERM_PROGRAM'] === 'Apple_Terminal') return 2;

  // COLORTERM env var
  const colorterm = env['COLORTERM'];
  if (colorterm === 'truecolor' || colorterm === '24bit') return 3;

  // TERM env var
  const term = env['TERM'] || '';
  if (term === 'dumb') return 0;

  if (/256color/i.test(term)) return 2;

  // CI environments
  if ('CI' in env) {
    const ciProviders = ['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI', 'GITHUB_ACTIONS', 'BUILDKITE', 'DRONE'];
    if (ciProviders.some(ci => ci in env)) return 1;
    if (env['CI_NAME'] === 'codeship') return 1;
    return 0;
  }

  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(term)) return 1;

  return 0;
}

export function detectColors(stream?: WriteStream | { isTTY?: boolean }): ColorSupport {
  const level = colorLevel(stream);
  return {
    level,
    has256: level >= 2,
    has16m: level >= 3,
  };
}

export function supportsHyperlinks(stream?: WriteStream | { isTTY?: boolean }): boolean {
  const env = process.env;

  // FORCE_HYPERLINK env var
  if ('FORCE_HYPERLINK' in env) {
    const val = env['FORCE_HYPERLINK'];
    return val !== '0' && val !== 'false';
  }

  // Must be a TTY
  if (!streamIsTTY(stream)) return false;

  // Known supporting terminals
  if (env['TERM_PROGRAM'] === 'iTerm.app') return true;
  if (env['TERM_PROGRAM'] === 'WezTerm') return true;
  if (env['WT_SESSION']) return true;
  if (env['VTE_VERSION']) {
    const version = parseInt(env['VTE_VERSION'], 10);
    return version >= 5000;
  }
  if (env['TERM_PROGRAM'] === 'vscode') return true;

  return false;
}
