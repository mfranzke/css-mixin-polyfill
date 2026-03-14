import { describe, expect, test } from 'vitest';
import {
	extractResultBlocks,
	findApplyRules,
	parseMacroDefinition,
	parseMixinDefinition,
	substituteContents,
	substituteParams,
	transformToNativeCSS
} from '../src/transform.js';

describe('CSS Transform Engine - Mixin/Macro', () => {
	describe('@macro Definition Parsing', () => {
		test('parses simple @macro definition', () => {
			const rule = '@macro --reset-list { margin: 0; padding: 0; }';
			const parsed = parseMacroDefinition(rule);

			expect(parsed).not.toBeNull();
			expect(parsed.type).toBe('macro');
			expect(parsed.name).toBe('--reset-list');
			expect(parsed.body).toContain('margin: 0');
			expect(parsed.body).toContain('padding: 0');
		});

		test('returns null for invalid macro name (no dashes)', () => {
			const rule = '@macro invalidName { margin: 0; }';
			const parsed = parseMacroDefinition(rule);
			expect(parsed).toBeNull();
		});
	});

	describe('@mixin Definition Parsing', () => {
		test('parses @mixin with empty params', () => {
			const rule = '@mixin --m1() { @result { .cls { color: green; } } }';
			const parsed = parseMixinDefinition(rule);

			expect(parsed).not.toBeNull();
			expect(parsed.type).toBe('mixin');
			expect(parsed.name).toBe('--m1');
			expect(parsed.params).toHaveLength(0);
			expect(parsed.resultBlocks).toHaveLength(1);
			expect(parsed.resultBlocks[0]).toContain('color: green');
		});

		test('parses @mixin with parameters and defaults', () => {
			const rule =
				'@mixin --gradient-text(--from <color>: red, --to <color>: blue) { @result { color: var(--from); } }';
			const parsed = parseMixinDefinition(rule);

			expect(parsed).not.toBeNull();
			expect(parsed.params).toHaveLength(2);
			expect(parsed.params[0].name).toBe('--from');
			expect(parsed.params[0].defaultValue).toBe('red');
			expect(parsed.params[1].name).toBe('--to');
			expect(parsed.params[1].defaultValue).toBe('blue');
		});

		test('returns null for mixin without dashed name', () => {
			const rule = '@mixin invalid-name() { @result { color: red; } }';
			const parsed = parseMixinDefinition(rule);
			expect(parsed).toBeNull();
		});

		test('returns null for mixin without parentheses', () => {
			const rule = '@mixin --missing-parens { @result { color: red; } }';
			const parsed = parseMixinDefinition(rule);
			expect(parsed).toBeNull();
		});
	});

	describe('@result Block Extraction', () => {
		test('extracts single @result block', () => {
			const body = '@result { color: red; font-size: 14px; }';
			const blocks = extractResultBlocks(body);

			expect(blocks).toHaveLength(1);
			expect(blocks[0]).toContain('color: red');
		});

		test('extracts multiple @result blocks', () => {
			const body =
				'@result { color: red; } @result { background: blue; }';
			const blocks = extractResultBlocks(body);

			expect(blocks).toHaveLength(2);
			expect(blocks[0]).toContain('color: red');
			expect(blocks[1]).toContain('background: blue');
		});

		test('returns empty array when no @result found', () => {
			const body = 'color: red; font-size: 14px;';
			const blocks = extractResultBlocks(body);
			expect(blocks).toHaveLength(0);
		});
	});

	describe('@apply Rule Detection', () => {
		test('finds simple @apply rule', () => {
			const body = '\t@apply --reset-list;\n';
			const applies = findApplyRules(body);

			expect(applies).toHaveLength(1);
			expect(applies[0].name).toBe('--reset-list');
			expect(applies[0].args).toHaveLength(0);
			expect(applies[0].contentsBlock).toBeNull();
		});

		test('finds @apply with arguments', () => {
			const body = '\t@apply --gradient(red, blue);\n';
			const applies = findApplyRules(body);

			expect(applies).toHaveLength(1);
			expect(applies[0].name).toBe('--gradient');
			expect(applies[0].args).toEqual(['red', 'blue']);
		});

		test('finds @apply with contents block', () => {
			const body =
				'\t@apply --wrapper { display: flex; flex-flow: column; }\n';
			const applies = findApplyRules(body);

			expect(applies).toHaveLength(1);
			expect(applies[0].name).toBe('--wrapper');
			expect(applies[0].contentsBlock).toContain('display: flex');
		});

		test('finds multiple @apply rules', () => {
			const body = '\t@apply --first;\n\t@apply --second;\n';
			const applies = findApplyRules(body);

			expect(applies).toHaveLength(2);
			expect(applies[0].name).toBe('--first');
			expect(applies[1].name).toBe('--second');
		});
	});

	describe('@contents Substitution', () => {
		test('substitutes @contents; with provided block', () => {
			const body = '@media (width <= 800px) { @contents; }';
			const result = substituteContents(
				body,
				'display: flex; flex-flow: column;'
			);
			expect(result).toContain('display: flex; flex-flow: column;');
			expect(result).not.toContain('@contents');
		});

		test('uses fallback when no contents block provided', () => {
			const body = '@contents { color: red; }';
			const result = substituteContents(body, null);
			expect(result).toContain('color: red');
		});

		test('replaces @contents fallback with provided block', () => {
			const body = '@contents { color: red; }';
			const result = substituteContents(body, 'color: blue;');
			expect(result).toContain('color: blue');
			expect(result).not.toContain('color: red');
		});
	});

	describe('Parameter Substitution', () => {
		test('substitutes var(--param) with argument value', () => {
			const body = 'color: var(--color);';
			const params = [{ name: '--color', defaultValue: 'red' }];
			const args = ['blue'];
			const result = substituteParams(body, params, args);
			expect(result).toBe('color: blue;');
		});

		test('uses default value when no argument provided', () => {
			const body = 'color: var(--color);';
			const params = [{ name: '--color', defaultValue: 'red' }];
			const result = substituteParams(body, params, []);
			expect(result).toBe('color: red;');
		});
	});

	describe('Full CSS Transformation', () => {
		test('transforms simple @macro with @apply', () => {
			const css = `
@macro --reset-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.foo {
  @apply --reset-list;
}`;
			const result = transformToNativeCSS(css);

			expect(result.nativeCSS).toContain('margin: 0');
			expect(result.nativeCSS).toContain('padding: 0');
			expect(result.nativeCSS).toContain('list-style: none');
			expect(result.nativeCSS).toContain('.foo');
			expect(result.nativeCSS).not.toContain('@macro');
			expect(result.nativeCSS).not.toContain('@apply');
		});

		test('transforms @mixin with @result and @apply', () => {
			const css = `
@mixin --m1() {
  @result {
    .cls { color: green; }
  }
}
div {
  @apply --m1;
}`;
			const result = transformToNativeCSS(css);

			expect(result.nativeCSS).toContain('color: green');
			expect(result.nativeCSS).toContain('div');
			expect(result.nativeCSS).not.toContain('@mixin');
			expect(result.nativeCSS).not.toContain('@apply');
			expect(result.nativeCSS).not.toContain('@result');
		});

		test('transforms @macro with @contents', () => {
			const css = `
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
			const result = transformToNativeCSS(css);

			expect(result.nativeCSS).toContain('@media (width <= 800px)');
			expect(result.nativeCSS).toContain('display: flex');
			expect(result.nativeCSS).toContain('flex-flow: column');
			expect(result.nativeCSS).not.toContain('@contents');
			expect(result.nativeCSS).not.toContain('@apply');
		});

		test('later @mixin definition overwrites earlier one', () => {
			const css = `
@mixin --m1() {
  @result { .cls { color: red; } }
}
@mixin --m1() {
  @result { .cls { color: green; } }
}
div { @apply --m1; }`;
			const result = transformToNativeCSS(css);

			expect(result.nativeCSS).toContain('color: green');
		});

		test('handles CSS with no @mixin/@macro/@apply', () => {
			const css = '.normal { color: blue; background: white; }';
			const result = transformToNativeCSS(css);

			expect(result.nativeCSS).toContain('color: blue');
			expect(result.nativeCSS).toContain('background: white');
			expect(result.hasRuntimeRules).toBe(false);
		});

		test('handles empty CSS input', () => {
			const result = transformToNativeCSS('');
			expect(result.nativeCSS).toBe('');
			expect(result.hasRuntimeRules).toBe(false);
		});

		test('removes @apply for undefined mixin/macro', () => {
			const css = '.test { @apply --nonexistent; color: red; }';
			const result = transformToNativeCSS(css);

			expect(result.nativeCSS).toContain('color: red');
			expect(result.nativeCSS).not.toContain('@apply');
		});
	});
});
