// Strip ANSI codes (replaces strip-ansi, ansi-regex, has-ansi)

// Returns a regex matching all ANSI escape sequences:
// - CSI sequences: ESC [ ... <final byte>  (includes SGR colors/styles)
// - OSC sequences: ESC ] ... (BEL | ESC \)  (includes hyperlinks, terminal titles)
// - Single-character escapes: ESC <char>     (e.g., ESC D, ESC M)
export function ansiRegex(): RegExp {
  // CSI: \x1b\[ followed by parameter bytes (0x30-0x3f)*, intermediate bytes (0x20-0x2f)*, final byte (0x40-0x7e)
  // OSC: \x1b\] followed by anything until BEL (\x07) or ST (\x1b\\)
  // Single-char escape: \x1b followed by a single char in 0x40-0x7e range
  return /\x1b(?:\[[0-9;?]*[0-9A-Za-z]|\].*?(?:\x07|\x1b\\)|\[[\s\S]|[A-Z@-~])/g;
}

// Remove all ANSI escape codes from a string
export function strip(str: string): string {
  return str.replace(ansiRegex(), '');
}

// Check if a string contains any ANSI escape codes
export function hasAnsi(str: string): boolean {
  return ansiRegex().test(str);
}
