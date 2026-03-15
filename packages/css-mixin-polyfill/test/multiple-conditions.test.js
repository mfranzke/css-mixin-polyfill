/* global describe, test, expect */

import { processCSSText } from '../src/index.js';

describe('CSS Mixin and Macro Polyfill - Multiple Apply Rules', () => {
	describe('Multiple @apply rules in a single selector', () => {
		test('should apply multiple different macros', () => {
			const cssText = `
@macro --spacing {
  margin: 10px;
  padding: 20px;
}
@macro --typography {
  font-family: Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
}
.card {
  @apply --spacing;
  @apply --typography;
  color: black;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('margin: 10px');
			expect(result).toContain('padding: 20px');
			expect(result).toContain('font-family: Arial, sans-serif');
			expect(result).toContain('font-size: 16px');
			expect(result).toContain('line-height: 1.5');
			expect(result).toContain('color: black');
			expect(result).not.toContain('@apply');
		});

		test('should apply the same macro multiple times in different selectors', () => {
			const cssText = `
@macro --reset {
  margin: 0;
  padding: 0;
}
.list {
  @apply --reset;
  list-style: none;
}
.nav {
  @apply --reset;
  display: flex;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('.list');
			expect(result).toContain('.nav');
			expect(result).toContain('list-style: none');
			expect(result).toContain('display: flex');
			// Both should have the macro content
			const marginCount = (result.match(/margin: 0/g) || []).length;
			expect(marginCount).toBe(2);
		});
	});

	describe('Mixin with multiple parameters', () => {
		test('should handle gradient mixin with multiple params', () => {
			const cssText = `
@mixin --gradient-text(--from <color>: mediumvioletred, --to <color>: teal) {
  @result {
    color: var(--from);
    background: linear-gradient(to right, var(--from), var(--to));
  }
}
h1 {
  @apply --gradient-text(pink, powderblue);
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('color: pink');
			expect(result).toContain(
				'background: linear-gradient(to right, pink, powderblue)'
			);
		});

		test('should handle partial arguments with defaults', () => {
			const cssText = `
@mixin --gradient-text(--from <color>: mediumvioletred, --to <color>: teal) {
  @result {
    color: var(--from);
    background: linear-gradient(to right, var(--from), var(--to));
  }
}
h1 {
  @apply --gradient-text(pink);
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('color: pink');
			expect(result).toContain(
				'background: linear-gradient(to right, pink, teal)'
			);
		});
	});

	describe('@macro with @contents and @media', () => {
		test('should handle media-wrapping macros', () => {
			const cssText = `
@macro --one-column {
  @media (width <= 800px) {
    @contents;
  }
}
@macro --two-column {
  @media (width > 800px) {
    @contents;
  }
}
body {
  @apply --one-column {
    display: flex;
    flex-flow: column;
  }
  @apply --two-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('@media (width <= 800px)');
			expect(result).toContain('@media (width > 800px)');
			expect(result).toContain('display: flex');
			expect(result).toContain('flex-flow: column');
			expect(result).toContain('display: grid');
			expect(result).toContain('grid-template-columns: 1fr 1fr');
			expect(result).not.toContain('@contents');
			expect(result).not.toContain('@apply');
		});
	});

	describe('Edge cases', () => {
		test('should handle @apply with empty argument list', () => {
			const cssText = `
@mixin --simple() {
  @result {
    color: red;
  }
}
.test {
  @apply --simple();
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('color: red');
		});

		test('should handle @apply without parens (same as empty)', () => {
			const cssText = `
@mixin --simple() {
  @result {
    color: red;
  }
}
.test {
  @apply --simple;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('color: red');
		});

		test('should handle undefined mixin reference gracefully', () => {
			const cssText = `.test {
  @apply --does-not-exist;
  color: blue;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('color: blue');
			expect(result).not.toContain('@apply');
		});
	});
});
