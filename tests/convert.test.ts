import { describe, it, expect } from 'vitest';
import { convert } from '../src/convert.js';
import { colorNames } from '../src/color-names.js';

describe('convert.rgb.hsl', () => {
  it('converts pure red', () => {
    expect(convert.rgb.hsl(255, 0, 0)).toEqual([0, 100, 50]);
  });

  it('converts pure green', () => {
    expect(convert.rgb.hsl(0, 128, 0)).toEqual([120, 100, 25]);
  });

  it('converts pure blue', () => {
    expect(convert.rgb.hsl(0, 0, 255)).toEqual([240, 100, 50]);
  });

  it('converts black', () => {
    expect(convert.rgb.hsl(0, 0, 0)).toEqual([0, 0, 0]);
  });

  it('converts white', () => {
    expect(convert.rgb.hsl(255, 255, 255)).toEqual([0, 0, 100]);
  });

  it('converts gray', () => {
    expect(convert.rgb.hsl(128, 128, 128)).toEqual([0, 0, 50]);
  });

  it('converts a mid-tone color', () => {
    const [h, s, l] = convert.rgb.hsl(255, 136, 0);
    expect(h).toBeGreaterThanOrEqual(31);
    expect(h).toBeLessThanOrEqual(33);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });
});

describe('convert.hsl.rgb', () => {
  it('converts pure red', () => {
    expect(convert.hsl.rgb(0, 100, 50)).toEqual([255, 0, 0]);
  });

  it('converts pure blue', () => {
    expect(convert.hsl.rgb(240, 100, 50)).toEqual([0, 0, 255]);
  });

  it('converts black', () => {
    expect(convert.hsl.rgb(0, 0, 0)).toEqual([0, 0, 0]);
  });

  it('converts white', () => {
    expect(convert.hsl.rgb(0, 0, 100)).toEqual([255, 255, 255]);
  });

  it('handles negative hue by wrapping', () => {
    expect(convert.hsl.rgb(-120, 100, 50)).toEqual(convert.hsl.rgb(240, 100, 50));
  });

  it('clamps saturation > 100', () => {
    expect(convert.hsl.rgb(0, 150, 50)).toEqual(convert.hsl.rgb(0, 100, 50));
  });
});

describe('convert.rgb.hsl round-trip', () => {
  it('round-trips pure colors', () => {
    for (const [r, g, b] of [[255, 0, 0], [0, 255, 0], [0, 0, 255]] as [number, number, number][]) {
      const hsl = convert.rgb.hsl(r, g, b);
      const back = convert.hsl.rgb(...hsl);
      expect(back[0]).toBeCloseTo(r, -1);
      expect(back[1]).toBeCloseTo(g, -1);
      expect(back[2]).toBeCloseTo(b, -1);
    }
  });
});

describe('convert.rgb.hsv', () => {
  it('converts pure red', () => {
    expect(convert.rgb.hsv(255, 0, 0)).toEqual([0, 100, 100]);
  });

  it('converts black', () => {
    expect(convert.rgb.hsv(0, 0, 0)).toEqual([0, 0, 0]);
  });

  it('converts white', () => {
    expect(convert.rgb.hsv(255, 255, 255)).toEqual([0, 0, 100]);
  });
});

describe('convert.hsv.rgb', () => {
  it('converts pure red', () => {
    expect(convert.hsv.rgb(0, 100, 100)).toEqual([255, 0, 0]);
  });

  it('converts pure green', () => {
    expect(convert.hsv.rgb(120, 100, 100)).toEqual([0, 255, 0]);
  });

  it('converts black', () => {
    expect(convert.hsv.rgb(0, 0, 0)).toEqual([0, 0, 0]);
  });
});

describe('convert.rgb.hsv round-trip', () => {
  it('round-trips primary colors', () => {
    for (const [r, g, b] of [[255, 0, 0], [0, 255, 0], [0, 0, 255]] as [number, number, number][]) {
      const hsv = convert.rgb.hsv(r, g, b);
      const back = convert.hsv.rgb(...hsv);
      expect(back[0]).toBeCloseTo(r, -1);
      expect(back[1]).toBeCloseTo(g, -1);
      expect(back[2]).toBeCloseTo(b, -1);
    }
  });
});

describe('convert.rgb.hwb', () => {
  it('converts pure red', () => {
    expect(convert.rgb.hwb(255, 0, 0)).toEqual([0, 0, 0]);
  });

  it('converts white', () => {
    expect(convert.rgb.hwb(255, 255, 255)).toEqual([0, 100, 0]);
  });

  it('converts black', () => {
    expect(convert.rgb.hwb(0, 0, 0)).toEqual([0, 0, 100]);
  });
});

describe('convert.hwb.rgb', () => {
  it('converts pure red', () => {
    expect(convert.hwb.rgb(0, 0, 0)).toEqual([255, 0, 0]);
  });

  it('converts to gray when w+b >= 1', () => {
    const result = convert.hwb.rgb(0, 50, 50);
    expect(result[0]).toBe(result[1]);
    expect(result[1]).toBe(result[2]);
  });

  it('converts white (100% whiteness)', () => {
    const result = convert.hwb.rgb(0, 100, 0);
    expect(result).toEqual([255, 255, 255]);
  });
});

describe('convert.rgb.cmyk', () => {
  it('converts pure red', () => {
    expect(convert.rgb.cmyk(255, 0, 0)).toEqual([0, 100, 100, 0]);
  });

  it('converts black', () => {
    expect(convert.rgb.cmyk(0, 0, 0)).toEqual([0, 0, 0, 100]);
  });

  it('converts white', () => {
    expect(convert.rgb.cmyk(255, 255, 255)).toEqual([0, 0, 0, 0]);
  });

  it('converts pure cyan', () => {
    expect(convert.rgb.cmyk(0, 255, 255)).toEqual([100, 0, 0, 0]);
  });
});

describe('convert.cmyk.rgb', () => {
  it('converts pure red', () => {
    expect(convert.cmyk.rgb(0, 100, 100, 0)).toEqual([255, 0, 0]);
  });

  it('converts black', () => {
    expect(convert.cmyk.rgb(0, 0, 0, 100)).toEqual([0, 0, 0]);
  });

  it('converts white', () => {
    expect(convert.cmyk.rgb(0, 0, 0, 0)).toEqual([255, 255, 255]);
  });
});

describe('convert.rgb.cmyk round-trip', () => {
  it('round-trips primary colors', () => {
    for (const [r, g, b] of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 255], [0, 0, 0]] as [number, number, number][]) {
      const cmyk = convert.rgb.cmyk(r, g, b);
      const back = convert.cmyk.rgb(...cmyk);
      expect(back[0]).toBeCloseTo(r, -1);
      expect(back[1]).toBeCloseTo(g, -1);
      expect(back[2]).toBeCloseTo(b, -1);
    }
  });
});

describe('convert.rgb.hex', () => {
  it('converts pure red', () => {
    expect(convert.rgb.hex(255, 0, 0)).toBe('#ff0000');
  });

  it('converts black', () => {
    expect(convert.rgb.hex(0, 0, 0)).toBe('#000000');
  });

  it('converts white', () => {
    expect(convert.rgb.hex(255, 255, 255)).toBe('#ffffff');
  });

  it('converts arbitrary color', () => {
    expect(convert.rgb.hex(255, 136, 0)).toBe('#ff8800');
  });
});

describe('convert.hex.rgb', () => {
  it('converts 6-digit hex', () => {
    expect(convert.hex.rgb('#ff0000')).toEqual([255, 0, 0]);
  });

  it('converts 3-digit hex', () => {
    expect(convert.hex.rgb('#f00')).toEqual([255, 0, 0]);
  });

  it('handles hex without #', () => {
    expect(convert.hex.rgb('ff8800')).toEqual([255, 136, 0]);
  });

  it('throws on invalid hex', () => {
    expect(() => convert.hex.rgb('xyz')).toThrow('Invalid hex color');
  });
});

describe('convert.rgb.hex round-trip', () => {
  it('round-trips via hex', () => {
    const hex = convert.rgb.hex(100, 200, 50);
    const back = convert.hex.rgb(hex);
    expect(back).toEqual([100, 200, 50]);
  });
});

describe('convert.rgb.ansi256', () => {
  it('maps black to index 16', () => {
    expect(convert.rgb.ansi256(0, 0, 0)).toBe(16);
  });

  it('maps near-white to index 231', () => {
    expect(convert.rgb.ansi256(255, 255, 255)).toBe(231);
  });

  it('maps gray to grayscale range', () => {
    const idx = convert.rgb.ansi256(128, 128, 128);
    expect(idx).toBeGreaterThanOrEqual(232);
    expect(idx).toBeLessThanOrEqual(255);
  });

  it('maps pure red to the 6x6x6 cube', () => {
    const idx = convert.rgb.ansi256(255, 0, 0);
    expect(idx).toBe(196); // 16 + 36*5 + 6*0 + 0
  });
});

describe('convert.ansi256.rgb', () => {
  it('converts standard colors (0-15)', () => {
    expect(convert.ansi256.rgb(0)).toEqual([0, 0, 0]);
    expect(convert.ansi256.rgb(1)).toEqual([128, 0, 0]);
    expect(convert.ansi256.rgb(15)).toEqual([255, 255, 255]);
  });

  it('converts 6x6x6 cube colors', () => {
    // Index 196 = 16 + 36*5 = pure red in cube
    expect(convert.ansi256.rgb(196)).toEqual([255, 0, 0]);
  });

  it('converts grayscale ramp', () => {
    const [r, g, b] = convert.ansi256.rgb(232);
    expect(r).toBe(g);
    expect(g).toBe(b);
    expect(r).toBe(8);
  });
});

describe('convert.rgb.ansi16', () => {
  it('maps black to 30', () => {
    expect(convert.rgb.ansi16(0, 0, 0)).toBe(30);
  });

  it('maps white to 97', () => {
    expect(convert.rgb.ansi16(255, 255, 255)).toBe(97);
  });

  it('maps bright red to 91', () => {
    expect(convert.rgb.ansi16(255, 0, 0)).toBe(91);
  });
});

describe('convert.ansi16.rgb', () => {
  it('converts basic red (31)', () => {
    expect(convert.ansi16.rgb(31)).toEqual([128, 0, 0]);
  });

  it('converts bright red (91)', () => {
    expect(convert.ansi16.rgb(91)).toEqual([255, 0, 0]);
  });

  it('converts black (30)', () => {
    expect(convert.ansi16.rgb(30)).toEqual([0, 0, 0]);
  });

  it('throws on invalid code', () => {
    expect(() => convert.ansi16.rgb(50)).toThrow('Invalid ANSI 16 code');
  });
});

describe('convert.keyword.rgb', () => {
  it('converts tomato', () => {
    expect(convert.keyword.rgb('tomato')).toEqual([255, 99, 71]);
  });

  it('converts rebeccapurple', () => {
    expect(convert.keyword.rgb('rebeccapurple')).toEqual([102, 51, 153]);
  });

  it('converts aliceblue', () => {
    expect(convert.keyword.rgb('aliceblue')).toEqual([240, 248, 255]);
  });

  it('is case-insensitive', () => {
    expect(convert.keyword.rgb('DodgerBlue')).toEqual([30, 144, 255]);
  });

  it('throws on unknown keyword', () => {
    expect(() => convert.keyword.rgb('notacolor')).toThrow('Unknown color keyword');
  });
});

describe('colorNames', () => {
  it('has 148 entries (including gray/grey duplicates)', () => {
    const count = Object.keys(colorNames).length;
    expect(count).toBeGreaterThanOrEqual(148);
  });

  it('spot-checks common colors', () => {
    expect(colorNames.red).toEqual([255, 0, 0]);
    expect(colorNames.green).toEqual([0, 128, 0]);
    expect(colorNames.blue).toEqual([0, 0, 255]);
    expect(colorNames.white).toEqual([255, 255, 255]);
    expect(colorNames.black).toEqual([0, 0, 0]);
    expect(colorNames.cyan).toEqual([0, 255, 255]);
    expect(colorNames.magenta).toEqual([255, 0, 255]);
    expect(colorNames.yellow).toEqual([255, 255, 0]);
    expect(colorNames.orange).toEqual([255, 165, 0]);
    expect(colorNames.pink).toEqual([255, 192, 203]);
    expect(colorNames.coral).toEqual([255, 127, 80]);
    expect(colorNames.salmon).toEqual([250, 128, 114]);
    expect(colorNames.gold).toEqual([255, 215, 0]);
    expect(colorNames.navy).toEqual([0, 0, 128]);
    expect(colorNames.teal).toEqual([0, 128, 128]);
    expect(colorNames.indigo).toEqual([75, 0, 130]);
    expect(colorNames.violet).toEqual([238, 130, 238]);
    expect(colorNames.peru).toEqual([205, 133, 63]);
    expect(colorNames.sienna).toEqual([160, 82, 45]);
    expect(colorNames.tan).toEqual([210, 180, 140]);
  });

  it('has gray/grey aliases with same values', () => {
    expect(colorNames.gray).toEqual(colorNames.grey);
    expect(colorNames.darkgray).toEqual(colorNames.darkgrey);
    expect(colorNames.lightgray).toEqual(colorNames.lightgrey);
    expect(colorNames.dimgray).toEqual(colorNames.dimgrey);
    expect(colorNames.slategray).toEqual(colorNames.slategrey);
  });

  it('all RGB values are in valid range [0, 255]', () => {
    for (const [name, [r, g, b]] of Object.entries(colorNames)) {
      expect(r, `${name} red`).toBeGreaterThanOrEqual(0);
      expect(r, `${name} red`).toBeLessThanOrEqual(255);
      expect(g, `${name} green`).toBeGreaterThanOrEqual(0);
      expect(g, `${name} green`).toBeLessThanOrEqual(255);
      expect(b, `${name} blue`).toBeGreaterThanOrEqual(0);
      expect(b, `${name} blue`).toBeLessThanOrEqual(255);
    }
  });
});
