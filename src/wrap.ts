// Word-wrap with ANSI awareness (replaces wrap-ansi, slice-ansi)

import { ansiRegex } from './strip.js';

export interface WrapOptions {
  hard?: boolean;    // Hard-break words longer than columns (default: false)
  trim?: boolean;    // Trim leading whitespace on wrapped lines (default: true)
  wordWrap?: boolean; // Enable word wrapping (default: true)
}

// Track ANSI state: collect all active open sequences so we can re-apply after breaks
function parseAnsiState(str: string): string[] {
  const re = ansiRegex();
  const active: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = re.exec(str)) !== null) {
    const seq = match[0];
    // SGR reset \x1b[0m or single-digit resets clear all state
    if (seq === '\x1b[0m' || seq === '\x1b[m') {
      active.length = 0;
    } else if (/^\x1b\[\d/.test(seq) && seq.endsWith('m')) {
      // SGR sequence — check if it's a close code
      const code = parseInt(seq.slice(2, -1), 10);
      if (isCloseCode(code)) {
        // Remove the matching open from active
        for (let i = active.length - 1; i >= 0; i--) {
          const openCode = parseInt(active[i].slice(2, -1), 10);
          if (closesOpen(code, openCode)) {
            active.splice(i, 1);
            break;
          }
        }
      } else {
        active.push(seq);
      }
    }
  }

  return active;
}

function isCloseCode(code: number): boolean {
  // Close codes: 22 (bold/dim), 23 (italic), 24 (underline), 27 (inverse),
  // 28 (hidden), 29 (strikethrough), 39 (fg color), 49 (bg color), 55 (overline)
  return [0, 22, 23, 24, 27, 28, 29, 39, 49, 55].includes(code);
}

function closesOpen(closeCode: number, openCode: number): boolean {
  const map: Record<number, number[]> = {
    22: [1, 2],       // closes bold (1) and dim (2)
    23: [3],          // closes italic
    24: [4],          // closes underline
    27: [7],          // closes inverse
    28: [8],          // closes hidden
    29: [9],          // closes strikethrough
    39: [30, 31, 32, 33, 34, 35, 36, 37, 38, 90, 91, 92, 93, 94, 95, 96, 97], // closes fg
    49: [40, 41, 42, 43, 44, 45, 46, 47, 48, 100, 101, 102, 103, 104, 105, 106, 107], // closes bg
    55: [53],         // closes overline
  };
  // For extended codes (38;..., 48;...) check the first number
  const opens = map[closeCode];
  if (!opens) return false;
  return opens.includes(openCode);
}

// Slice a string by visible character positions, preserving ANSI codes
export function sliceAnsi(str: string, start: number, end?: number): string {
  const re = ansiRegex();
  let visibleIndex = 0;
  let result = '';
  let match: RegExpExecArray | null;
  const actualEnd = end ?? Infinity;

  // Collect ANSI sequences that are active before the start position
  const preSlice = getVisiblePrefix(str, start);
  const activeState = parseAnsiState(preSlice);

  // Prepend active state
  result = activeState.join('');

  re.lastIndex = 0;
  let strIndex = 0;

  while (strIndex < str.length) {
    re.lastIndex = strIndex;
    match = re.exec(str);

    if (match && match.index === strIndex) {
      // This is an ANSI sequence at the current position
      if (visibleIndex >= start && visibleIndex < actualEnd) {
        result += match[0];
      }
      strIndex += match[0].length;
    } else {
      // Visible character
      const nextAnsi = match ? match.index : str.length;
      while (strIndex < nextAnsi && strIndex < str.length) {
        if (visibleIndex >= start && visibleIndex < actualEnd) {
          result += str[strIndex];
        }
        visibleIndex++;
        strIndex++;
        if (visibleIndex >= actualEnd) break;
      }
      if (visibleIndex >= actualEnd) break;
    }
  }

  // Append any needed close codes if we have active state
  if (activeState.length > 0 && visibleIndex > start) {
    result += '\x1b[0m';
  }

  return result;
}

// Get the raw string up to the given visible character index
function getVisiblePrefix(str: string, visibleEnd: number): string {
  const re = ansiRegex();
  let visibleIndex = 0;
  let strIndex = 0;
  let match: RegExpExecArray | null;

  while (strIndex < str.length && visibleIndex < visibleEnd) {
    re.lastIndex = strIndex;
    match = re.exec(str);

    if (match && match.index === strIndex) {
      strIndex += match[0].length;
    } else {
      const nextAnsi = match ? match.index : str.length;
      while (strIndex < nextAnsi && visibleIndex < visibleEnd) {
        visibleIndex++;
        strIndex++;
      }
    }
  }

  return str.slice(0, strIndex);
}

// Truncate a styled string at visible length, appending ellipsis if truncated
export function truncateAnsi(str: string, maxLength: number, ellipsis: string = ''): string {
  let match: RegExpExecArray | null;

  // Count visible length
  const tempRe = ansiRegex();
  let tempIndex = 0;
  let totalVisible = 0;
  while (tempIndex < str.length) {
    tempRe.lastIndex = tempIndex;
    match = tempRe.exec(str);
    if (match && match.index === tempIndex) {
      tempIndex += match[0].length;
    } else {
      const nextAnsi = match ? match.index : str.length;
      totalVisible += nextAnsi - tempIndex;
      tempIndex = nextAnsi;
    }
  }

  if (totalVisible <= maxLength) return str;

  const truncLen = maxLength - ellipsis.length;
  if (truncLen <= 0) return ellipsis.slice(0, maxLength);

  return sliceAnsi(str, 0, truncLen) + ellipsis;
}

// Word-wrap a string containing ANSI codes at the given column width
export function wrapAnsi(str: string, columns: number, options?: WrapOptions): string {
  const hard = options?.hard ?? false;
  const trim = options?.trim ?? true;
  const wordWrap = options?.wordWrap ?? true;

  if (columns < 1) return str;

  // Process each input line separately
  const inputLines = str.split('\n');
  const outputLines: string[] = [];

  for (const inputLine of inputLines) {
    if (inputLine === '') {
      outputLines.push('');
      continue;
    }

    const re = ansiRegex();
    // Split into tokens: visible characters and ANSI sequences
    const tokens: Array<{ type: 'char' | 'ansi' | 'space'; value: string }> = [];
    let idx = 0;
    let match: RegExpExecArray | null;

    while (idx < inputLine.length) {
      re.lastIndex = idx;
      match = re.exec(inputLine);

      if (match && match.index === idx) {
        tokens.push({ type: 'ansi', value: match[0] });
        idx += match[0].length;
      } else {
        const nextAnsi = match ? match.index : inputLine.length;
        while (idx < nextAnsi) {
          const ch = inputLine[idx];
          tokens.push({ type: ch === ' ' || ch === '\t' ? 'space' : 'char', value: ch });
          idx++;
        }
      }
    }

    // Build words: a word is a sequence of non-space visible chars (with interleaved ANSI)
    interface Word {
      raw: string;       // the raw string including ANSI codes
      visibleLength: number;
    }

    const words: Array<Word | 'space'> = [];
    let currentWord: { raw: string; visibleLength: number } | null = null;

    for (const token of tokens) {
      if (token.type === 'space') {
        if (currentWord) {
          words.push(currentWord);
          currentWord = null;
        }
        words.push('space');
      } else if (token.type === 'ansi') {
        if (!currentWord) {
          currentWord = { raw: '', visibleLength: 0 };
        }
        currentWord.raw += token.value;
      } else {
        if (!currentWord) {
          currentWord = { raw: '', visibleLength: 0 };
        }
        currentWord.raw += token.value;
        currentWord.visibleLength++;
      }
    }
    if (currentWord) words.push(currentWord);

    // Now lay out words onto lines
    let line = '';
    let lineWidth = 0;
    const activeAnsi: string[] = [];
    const lines: string[] = [];

    function pushLine(content: string): void {
      if (trim) {
        content = content.replace(/\s+$/, '');
      }
      lines.push(content);
    }

    for (let w = 0; w < words.length; w++) {
      const item = words[w];

      if (item === 'space') {
        if (lineWidth > 0 && lineWidth < columns) {
          line += ' ';
          lineWidth++;
        }
        continue;
      }

      const word = item as Word;

      if (wordWrap && lineWidth > 0 && lineWidth + word.visibleLength > columns) {
        // Wrap to next line
        pushLine(line);
        line = activeAnsi.join('');
        lineWidth = 0;
        if (trim) {
          // Skip leading spaces after wrap — already handled by not adding space
        }
      }

      if (hard && word.visibleLength > columns) {
        // Hard break: split the word across multiple lines
        const re2 = ansiRegex();
        let charIdx = 0;
        let wordIdx = 0;
        while (wordIdx < word.raw.length) {
          re2.lastIndex = wordIdx;
          const m = re2.exec(word.raw);
          if (m && m.index === wordIdx) {
            line += m[0];
            // Track ANSI state
            updateAnsiState(activeAnsi, m[0]);
            wordIdx += m[0].length;
          } else {
            if (lineWidth >= columns) {
              pushLine(line);
              line = activeAnsi.join('');
              lineWidth = 0;
            }
            line += word.raw[wordIdx];
            lineWidth++;
            charIdx++;
            wordIdx++;
          }
        }
      } else {
        line += word.raw;
        lineWidth += word.visibleLength;
        // Track ANSI state in the word
        const seqs = word.raw.match(ansiRegex());
        if (seqs) {
          for (const seq of seqs) {
            updateAnsiState(activeAnsi, seq);
          }
        }
      }
    }

    if (line || lines.length === 0) {
      pushLine(line);
    }

    outputLines.push(...lines);
  }

  return outputLines.join('\n');
}

function updateAnsiState(active: string[], seq: string): void {
  if (seq === '\x1b[0m' || seq === '\x1b[m') {
    active.length = 0;
  } else if (/^\x1b\[\d/.test(seq) && seq.endsWith('m')) {
    const code = parseInt(seq.slice(2, -1), 10);
    if (isCloseCode(code)) {
      for (let i = active.length - 1; i >= 0; i--) {
        const openCode = parseInt(active[i].slice(2, -1), 10);
        if (closesOpen(code, openCode)) {
          active.splice(i, 1);
          break;
        }
      }
    } else {
      active.push(seq);
    }
  }
}
