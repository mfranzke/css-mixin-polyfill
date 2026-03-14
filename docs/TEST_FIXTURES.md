# CSS Mixin/Macro Polyfill — Test Fixtures

This document describes the centralized test fixture system. Each fixture consists of an `.input.css` / `.expected.css` pair in the `test/fixtures/` directory and serves as the single source of truth for CSS transformation tests across all test suites (polyfill, PostCSS plugin, and any future transform backends).

To modify a test case, edit the corresponding fixture files directly — do not edit the code blocks in this document.

---

## Fixture Naming Convention

Fixtures follow the pattern:

```
test/fixtures/<category>.<name>.input.css
test/fixtures/<category>.<name>.expected.css
```

| Category | Description                                                   |
| -------- | ------------------------------------------------------------- |
| `macro`  | `@macro` definitions and `@apply` substitution                |
| `mixin`  | `@mixin` definitions with `@result`, parameters, and `@apply` |

---

## macro.simple — Simple `@macro` and `@apply`

A basic `@macro` defines a reusable block of declarations with no parameters. `@apply` substitutes the macro body at the call site.

**Source:** [test/fixtures/macro.simple.input.css](../test/fixtures/macro.simple.input.css)

**Input CSS:**

```css
/* https://drafts.csswg.org/css-mixins/#example-56012a8a */
@macro --reset-list {
	margin: 0;
	padding: 0;
	list-style: none;
}
.foo {
	@apply --reset-list;
}
```

**Expected Output:**

```css
.foo {
	margin: 0;
	padding: 0;
	list-style: none;
}
```

**What this tests:**

- `@macro` definition with a dashed-ident name
- `@apply` substitution of the macro body into a style rule
- Removal of the `@macro` definition from the output

---

## mixin.basic — `@mixin` with `@result`, Overwriting, and Validation

Tests core `@mixin` behaviour including the `@result` rule, last-definition-wins semantics, and rejection of invalid definitions.

**Source:** [test/fixtures/mixin.basic.input.css](../test/fixtures/mixin.basic.input.css)

**Input CSS:**

```css
/* https://github.com/web-platform-tests/wpt/blob/master/css/css-mixins/mixin-basic.html */
@mixin --m1() {
	/* Will be overwritten. */
	@result {
		.cls {
			color: red;
		}
	}
}
@mixin --m1() {
	@result {
		.cls {
			color: green;
		}
	}
}
@mixin invalid-name() {
	@result {
		.cls {
			color: red;
		}
	}
}
@mixin --missing-argument-list {
	@result {
		.cls {
			color: red;
		}
	}
}
@mixin --missing-result1() {
	.cls {
		color: red;
	}
}
@mixin --missing-result2() {
	color: red;
}
@mixin --empty1() {
}
@mixin --empty2() {
	@result {
	}
}
div {
	@apply --m1;
	@apply invalid-name;
	@apply --missing-argument-list;
	@apply --missing-result1;
	@apply --missing-result2;
	@apply --empty1;
	@apply --empty2;
}
```

**Expected Output:**

```css
div {
	.cls {
		color: green;
	}
}
```

**What this tests:**

- **Last-definition-wins:** Two `@mixin --m1()` definitions — the second replaces the first
- **Invalid name:** `@mixin invalid-name()` (no `--` prefix) is ignored
- **Missing argument list:** `@mixin --missing-argument-list` (no parentheses) is ignored
- **Missing `@result`:** `--missing-result1` and `--missing-result2` have no `@result` block, so `@apply` produces nothing
- **Empty definitions:** `--empty1` (empty body) and `--empty2` (empty `@result`) produce no output
- Only the valid, last-defined `--m1` with a non-empty `@result` generates output

---

## macro.contents — `@macro` with `@contents` and Fallback

Tests the `@contents` substitution rule inside macros. The caller passes a style block via `@apply … { … }`, and the macro substitutes it at the `@contents` location.

**Source:** [test/fixtures/macro.contents.input.css](../test/fixtures/macro.contents.input.css)

**Input CSS:**

```css
/* https://drafts.csswg.org/css-mixins/#example-91b6faa7 */
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
		grid-template-columns: 60px 60px;
	}
}
```

**Expected Output:**

```css
body {
	@media (width <= 800px) {
		display: flex;
		flex-flow: column;
	}
	@media (width > 800px) {
		display: grid;
		grid-template-columns: 60px 60px;
	}
}
```

**What this tests:**

- `@contents` substitution: the caller's block replaces `@contents;` in the macro body
- Multiple `@apply` invocations with contents blocks in the same rule
- Macro wrapping caller styles inside `@media` conditional rules
- Removal of `@macro` definitions from the output

---

## mixin.declarations — `@mixin` with Declaration-Level Output

Tests a minimal `@mixin` that emits plain declarations via `@result`, verifying that the output merges into the calling rule.

**Source:** [test/fixtures/mixin.declarations.input.css](../test/fixtures/mixin.declarations.input.css)

**Input CSS:**

```css
/* https://github.com/web-platform-tests/wpt/blob/master/css/css-mixins/mixin-declarations.html */
@mixin --m1() {
	@result {
		color: green;
	}
}
div {
	color: red;
	@apply --m1;
}
```

**Expected Output:**

```css
div {
	color: red;
	color: green;
}
```

**What this tests:**

- `@mixin` with a `@result` block containing a single declaration
- `@apply` appends the mixin result after existing declarations in the rule
- The mixin's `color: green` follows the rule's own `color: red`, so it wins per normal CSS cascade order

---

## Adding New Fixtures

1. Create `test/fixtures/<category>.<name>.input.css` with the source CSS
2. Create `test/fixtures/<category>.<name>.expected.css` with the expected output
3. Add a section to this document describing the fixture
4. Ensure the fixture works for all transform backends (polyfill, PostCSS plugin) — use the same fixture pair wherever possible
5. Run the full test suite to verify: `pnpm test`
