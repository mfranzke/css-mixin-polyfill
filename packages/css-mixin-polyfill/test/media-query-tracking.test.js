/* global describe, test, expect */

import { processCSSText } from '../src/index.js';

describe('CSS Mixin Parameter Handling', () => {
	describe('Parameter defaults', () => {
		test('should use default values when no args are provided', () => {
			const cssText = `
@mixin --button(--bg <color>: gray, --fg <color>: white) {
  @result {
    background: var(--bg);
    color: var(--fg);
  }
}
.btn {
  @apply --button;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('background: gray');
			expect(result).toContain('color: white');
		});

		test('should override defaults with provided args', () => {
			const cssText = `
@mixin --button(--bg <color>: gray, --fg <color>: white) {
  @result {
    background: var(--bg);
    color: var(--fg);
  }
}
.btn {
  @apply --button(blue, black);
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('background: blue');
			expect(result).toContain('color: black');
		});

		test('should allow partial args', () => {
			const cssText = `
@mixin --button(--bg <color>: gray, --fg <color>: white) {
  @result {
    background: var(--bg);
    color: var(--fg);
  }
}
.btn {
  @apply --button(blue);
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('background: blue');
			expect(result).toContain('color: white');
		});
	});

	describe('Parameter types (parsed but not validated)', () => {
		test('should parse type annotations in params', () => {
			const cssText = `
@mixin --sized(--size <length>: 10px) {
  @result {
    width: var(--size);
    height: var(--size);
  }
}
.box {
  @apply --sized(50px);
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('width: 50px');
			expect(result).toContain('height: 50px');
		});
	});

	describe('@contents with @mixin', () => {
		test('should handle @contents inside @mixin @result', () => {
			const cssText = `
@mixin --responsive() {
  @result {
    @media (width <= 800px) {
      @contents;
    }
  }
}
.sidebar {
  @apply --responsive {
    display: none;
  }
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('@media (width <= 800px)');
			expect(result).toContain('display: none');
			expect(result).not.toContain('@contents');
		});
	});

	describe('Macro-only @contents', () => {
		test('should substitute contents in @macro', () => {
			const cssText = `
@macro --dark-mode {
  @media (prefers-color-scheme: dark) {
    @contents;
  }
}
body {
  @apply --dark-mode {
    background: black;
    color: white;
  }
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('@media (prefers-color-scheme: dark)');
			expect(result).toContain('background: black');
			expect(result).toContain('color: white');
		});
	});
});
