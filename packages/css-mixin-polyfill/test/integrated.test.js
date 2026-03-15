import { describe, expect, test } from 'vitest';
import {
	basicFixtureTests,
	loadFixture,
	normalizeCSS
} from '../../../test/scripts/fixture-utils.js';
import { buildTimeTransform, processCSSText } from '../src/index.js';

describe('Integrated CSS Mixin and Macro Polyfill', () => {
	describe('Build-time transformation with fixtures', () => {
		// Generate tests for each fixture
		for (const { fixture, description } of basicFixtureTests) {
			test(description, () => {
				const { input, expected } = loadFixture(fixture);
				const result = buildTimeTransform(input);

				expect(normalizeCSS(result.nativeCSS)).toBe(
					normalizeCSS(expected)
				);
				expect(result.hasRuntimeRules).toBe(false);
			});
		}
	});

	describe('Build-time transformation', () => {
		test('transforms @macro correctly', () => {
			const css = `
@macro --reset-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.foo {
  @apply --reset-list;
}`;
			const result = buildTimeTransform(css);

			expect(result.nativeCSS).toContain('margin: 0');
			expect(result.nativeCSS).toContain('padding: 0');
			expect(result.nativeCSS).toContain('list-style: none');
			expect(result.hasRuntimeRules).toBe(false);
		});

		test('transforms @mixin with parameters correctly', () => {
			const css = `
@mixin --colored(--color <color>: red) {
  @result {
    color: var(--color);
  }
}
.test {
  @apply --colored(blue);
}`;
			const result = buildTimeTransform(css);

			expect(result.nativeCSS).toContain('color: blue');
			expect(result.hasRuntimeRules).toBe(false);
		});

		test('minifies output when requested', () => {
			const css = `
@macro --spacing {
  margin: 10px;
  padding: 20px;
}
.test {
  @apply --spacing;
}`;
			const result = buildTimeTransform(css, { minify: true });

			// Minified CSS should have reduced whitespace
			expect(result.nativeCSS).not.toContain('\n  ');
		});

		test('reports transformation statistics', () => {
			const css = `
@macro --m {
  color: red;
}
.test {
  @apply --m;
}
.other {
  font-size: 16px;
}`;
			const result = buildTimeTransform(css);

			expect(result.stats).toBeDefined();
			expect(result.stats.totalRules).toBeGreaterThan(0);
			expect(result.stats.transformedRules).toBeGreaterThan(0);
		});
	});

	describe('Runtime processing integration', () => {
		test('processes CSS text correctly', () => {
			const css = `
@macro --highlight {
  background: yellow;
}
.test {
  @apply --highlight;
}`;
			const result = processCSSText(css);

			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
			expect(result).toContain('background: yellow');
		});

		test('passes through CSS without @mixin/@macro/@apply unchanged', () => {
			const css = '.test { color: blue; font-size: 14px; }';
			const result = processCSSText(css);

			expect(result).toBe(css);
		});
	});

	describe('Complex scenarios', () => {
		test('handles nested mixin applications', () => {
			const css = `
@macro --reset {
  margin: 0;
  padding: 0;
}
@mixin --card() {
  @result {
    @apply --reset;
    border: 1px solid gray;
    border-radius: 4px;
  }
}
.card {
  @apply --card;
}`;
			const result = buildTimeTransform(css);

			expect(result.nativeCSS).toContain('margin: 0');
			expect(result.nativeCSS).toContain('border: 1px solid gray');
			expect(result.nativeCSS).not.toContain('@apply');
		});

		test('preserves non-mixin CSS rules', () => {
			const css = `
@macro --highlight {
  background: yellow;
}
.header {
  background: blue;
  font-size: 24px;
}
.test {
  @apply --highlight;
}
.footer {
  padding: 20px;
}`;
			const result = buildTimeTransform(css);

			// Should preserve non-mixin rules
			expect(result.nativeCSS).toContain('background: blue');
			expect(result.nativeCSS).toContain('font-size: 24px');
			expect(result.nativeCSS).toContain('padding: 20px');
		});
	});

	describe('Error handling', () => {
		test('handles empty input', () => {
			const result = buildTimeTransform('');
			expect(result).toBeDefined();
			expect(result.nativeCSS).toBe('');
		});

		test('handles CSS with only regular rules (no mixins)', () => {
			const css = '.test { color: blue; }';
			const result = buildTimeTransform(css);

			expect(result).toBeDefined();
			expect(result.nativeCSS).toContain('color: blue');
		});
	});
});
