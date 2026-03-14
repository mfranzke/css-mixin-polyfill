/* global describe, test, expect */

import { processCSSText } from '../src/index.js';

describe('Enhanced CSS Mixin and Macro Polyfill - Advanced Scenarios', () => {
	describe('Multiple @apply rules in one selector', () => {
		test('should apply multiple macros in a single rule', () => {
			const cssText = `
@macro --reset-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
@macro --center-text {
  text-align: center;
}
.nav {
  @apply --reset-list;
  @apply --center-text;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('margin: 0');
			expect(result).toContain('padding: 0');
			expect(result).toContain('list-style: none');
			expect(result).toContain('text-align: center');
			expect(result).not.toContain('@apply');
		});
	});

	describe('Mixin parameters with multiple arguments', () => {
		test('should substitute multiple parameters', () => {
			const cssText = `
@mixin --box(--width <length>: 100px, --height <length>: 50px) {
  @result {
    width: var(--width);
    height: var(--height);
  }
}
.box {
  @apply --box(200px, 100px);
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('width: 200px');
			expect(result).toContain('height: 100px');
		});

		test('should use defaults for missing arguments', () => {
			const cssText = `
@mixin --box(--width <length>: 100px, --height <length>: 50px) {
  @result {
    width: var(--width);
    height: var(--height);
  }
}
.box {
  @apply --box;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('width: 100px');
			expect(result).toContain('height: 50px');
		});
	});

	describe('Nested @apply within mixin @result', () => {
		test('should handle nested mixin/macro application', () => {
			const cssText = `
@macro --reset {
  margin: 0;
  padding: 0;
}
@mixin --card() {
  @result {
    @apply --reset;
    border: 1px solid gray;
  }
}
.card {
  @apply --card;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('margin: 0');
			expect(result).toContain('padding: 0');
			expect(result).toContain('border: 1px solid gray');
			expect(result).not.toContain('@apply');
		});
	});

	describe('Later definitions overwrite earlier ones', () => {
		test('should use the last definition when names conflict', () => {
			const cssText = `
@macro --style {
  color: red;
}
@macro --style {
  color: blue;
}
.test {
  @apply --style;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('color: blue');
			expect(result).not.toContain('color: red');
		});

		test('macro and mixin share the same namespace', () => {
			const cssText = `
@macro --shared {
  color: red;
}
@mixin --shared() {
  @result {
    color: green;
  }
}
.test {
  @apply --shared;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('color: green');
		});
	});

	describe('@contents fallback', () => {
		test('should use @contents fallback when no contents block is provided', () => {
			const cssText = `
@macro --wrapper {
  @contents { color: red; }
}
.test {
  @apply --wrapper;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('color: red');
		});

		test('should override fallback with provided contents block', () => {
			const cssText = `
@macro --wrapper {
  @contents { color: red; }
}
.test {
  @apply --wrapper { color: blue; }
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('color: blue');
			expect(result).not.toContain('color: red');
		});

		test('should substitute nothing for empty contents block', () => {
			const cssText = `
@macro --wrapper {
  @contents { color: red; }
}
.test {
  @apply --wrapper {}
}`;
			const result = processCSSText(cssText);

			expect(result).not.toContain('color: red');
		});
	});

	describe('Complex CSS with mixed regular and mixin rules', () => {
		test('should preserve non-mixin rules alongside mixin substitutions', () => {
			const cssText = `
@macro --highlight {
  background: yellow;
  font-weight: bold;
}
.header {
  font-size: 24px;
}
.important {
  @apply --highlight;
  font-size: 16px;
}
.footer {
  padding: 20px;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('.header');
			expect(result).toContain('font-size: 24px');
			expect(result).toContain('background: yellow');
			expect(result).toContain('font-weight: bold');
			expect(result).toContain('font-size: 16px');
			expect(result).toContain('.footer');
			expect(result).toContain('padding: 20px');
			expect(result).not.toContain('@macro');
			expect(result).not.toContain('@apply');
		});
	});
});
