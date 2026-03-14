/* global document, describe, test, expect, beforeEach, afterEach */

import { hasNativeSupport, init, processCSSText } from '../src/index.js';

describe('CSS Mixin and Macro Polyfill', () => {
	afterEach(() => {
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	describe('Initialization', () => {
		test('should have named function exports', () => {
			expect(typeof init).toBe('function');
			expect(typeof processCSSText).toBe('function');
			expect(typeof hasNativeSupport).toBe('function');
		});
	});

	describe('Native Support Detection', () => {
		test('should detect lack of native support', () => {
			expect(hasNativeSupport()).toBe(false);
		});
	});

	describe('CSS Text Processing - @macro', () => {
		test('should transform simple @macro with @apply', () => {
			const cssText = `
@macro --reset-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.foo {
  @apply --reset-list;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('margin: 0');
			expect(result).toContain('padding: 0');
			expect(result).toContain('list-style: none');
			expect(result).toContain('.foo');
			expect(result).not.toContain('@macro');
			expect(result).not.toContain('@apply');
		});

		test('should transform @macro with @contents', () => {
			const cssText = `
@macro --one-column {
  @media (width <= 800px) {
    @contents;
  }
}
body {
  @apply --one-column {
    display: flex;
    flex-flow: column;
  }
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('@media (width <= 800px)');
			expect(result).toContain('display: flex');
			expect(result).toContain('flex-flow: column');
			expect(result).not.toContain('@contents');
			expect(result).not.toContain('@apply');
		});
	});

	describe('CSS Text Processing - @mixin', () => {
		test('should transform @mixin with @result and @apply', () => {
			const cssText = `
@mixin --m1() {
  @result {
    color: green;
  }
}
div {
  @apply --m1;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('color: green');
			expect(result).toContain('div');
			expect(result).not.toContain('@mixin');
			expect(result).not.toContain('@apply');
			expect(result).not.toContain('@result');
		});

		test('should substitute mixin parameters', () => {
			const cssText = `
@mixin --colored(--color <color>: red) {
  @result {
    color: var(--color);
  }
}
.test {
  @apply --colored(blue);
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('color: blue');
			expect(result).not.toContain('var(--color)');
		});

		test('should use default parameter values when no argument provided', () => {
			const cssText = `
@mixin --colored(--color <color>: red) {
  @result {
    color: var(--color);
  }
}
.test {
  @apply --colored;
}`;
			const result = processCSSText(cssText);

			expect(result).toContain('color: red');
		});
	});

	describe('Pass-through behavior', () => {
		test('should return CSS unchanged when no @mixin/@macro/@apply present', () => {
			const cssText = '.test { color: blue; background: white; }';
			const result = processCSSText(cssText);

			expect(result).toBe(cssText);
		});
	});

	describe('Public API', () => {
		test('should export init function', () => {
			expect(typeof init).toBe('function');
		});

		test('should export processCSSText function', () => {
			expect(typeof processCSSText).toBe('function');
		});

		test('should handle processCSSText with options', () => {
			const cssText = `
@macro --m { color: red; }
.test { @apply --m; }`;
			const result = processCSSText(cssText, { debug: true });

			expect(result).toContain('color: red');
		});
	});

	describe('Error Handling', () => {
		test('should remove @apply for undefined mixin/macro', () => {
			const cssText = '.test { @apply --nonexistent; color: red; }';
			const result = processCSSText(cssText);

			expect(result).toContain('color: red');
			expect(result).not.toContain('@apply');
		});

		test('should handle empty input', () => {
			const result = processCSSText('');
			expect(result).toBe('');
		});
	});
});
