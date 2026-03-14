# CSS Mixin Polyfill

[![MIT license](https://img.shields.io/npm/l/css-mixin-polyfill.svg "license badge")](https://opensource.org/licenses/mit-license.php)

[![Default CI/CD Pipeline](https://github.com/mfranzke/css-mixin-polyfill/actions/workflows/default.yml/badge.svg)](https://github.com/mfranzke/css-mixin-polyfill/actions/workflows/default.yml)
[![Total downloads ~ Npmjs](https://img.shields.io/npm/dt/css-mixin-polyfill.svg "Count of total downloads – NPM")](https://npmjs.com/package/css-mixin-polyfill "CSS mixin polyfill – on NPM")
[![jsDelivr CDN downloads](https://data.jsdelivr.com/v1/package/npm/css-mixin-polyfill/badge "Count of total downloads – jsDelivr")](https://www.jsdelivr.com/package/npm/css-mixin-polyfill "CSS mixin polyfill – on jsDelivr")

[![css-mixin-polyfill on Npmjs](https://img.shields.io/npm/v/css-mixin-polyfill.svg?color=rgb%28237%2C%2028%2C%2036%29 "npm version")](https://npmjs.com/package/css-mixin-polyfill "CSS mixin polyfill – on NPM")
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Open Source Love](https://badges.frapsoft.com/os/v3/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](CODE-OF-CONDUCT.md)

A JavaScript polyfill for [CSS `@mixin`, `@macro`, and `@apply` rules](https://drafts.csswg.org/css-mixins/) with **hybrid build-time and runtime processing**. Define reusable style blocks with `@mixin` and `@macro`, then apply them anywhere with `@apply`.

## Features

- ✅ **`@mixin` rules** with parameters, default values, type constraints, and `@result` blocks
- ✅ **`@macro` rules** for simple, argument-free reusable style blocks
- ✅ **`@apply` rules** to invoke mixins and macros, with arguments and contents blocks
- ✅ **`@contents` blocks** for caller-provided style injection
- ✅ **Local variables** scoped within mixin bodies, with hygienic renaming
- ✅ **Nested `@apply`** — mixins and macros can invoke other mixins and macros
- ✅ **Build-time transformation** via CLI for zero-runtime-cost output
- ✅ **Runtime processing** for dynamic stylesheets
- ✅ **TypeScript support** with full type definitions
- ✅ **Zero dependencies** — pure JavaScript implementation
- ✅ **Multiple build formats** (ES module, CommonJS, UMD)

## Installation

```bash
npm install css-mixin-polyfill
```

## Quick Start

### Build-time Transformation (Recommended)

```bash
npx css-mixin-polyfill input.css output.css --minify --stats
```

### Runtime Processing

```javascript
import { init } from "css-mixin-polyfill";

init();
```

## Usage

### Automatic Initialization

Simply import the polyfill and it will automatically process stylesheets containing `@mixin`, `@macro`, and `@apply` rules:

```javascript
import "css-mixin-polyfill";
```

Or include it via script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/css-mixin-polyfill/dist/index.umd.min.js"></script>
```

### Manual Initialization

```javascript
import { init } from "css-mixin-polyfill";

const polyfill = init({
	debug: true,
	autoInit: true
});
```

### Processing CSS Text Directly

```javascript
import { processCSSText } from "css-mixin-polyfill";

const css = `
@mixin --highlight(--color <color>: gold) {
  @result {
    background-color: var(--color);
    font-weight: bold;
  }
}

.alert {
  @apply --highlight(tomato);
}
`;

const processed = processCSSText(css);
// .alert { background-color: tomato; font-weight: bold; }
```

## CSS Syntax

### `@mixin` — Reusable Styles with Parameters

A `@mixin` defines a reusable block of styles that accepts parameters with optional types and default values. The styles to emit are wrapped in a `@result` block.

```css
@mixin --gradient-text(
	--from <color>: mediumvioletred,
	--to <color>: teal,
	--angle: to bottom right
) {
	--gradient: linear-gradient(var(--angle), var(--from), var(--to));
	@result {
		color: var(--from);

		@supports (background-clip: text) or (-webkit-background-clip: text) {
			background: var(--gradient);
			color: transparent;
			-webkit-background-clip: text;
			background-clip: text;
		}
	}
}

h1 {
	@apply --gradient-text(pink, powderblue);
}
```

- **Parameters** are declared as custom properties with optional `<type>` constraints and `: default` values.
- **Local variables** (custom properties outside `@result`) are scoped to the mixin body and won’t leak into element styles.
- **`@result`** marks the styles that will be substituted at the `@apply` site.

### `@macro` — Simple Reusable Styles

A `@macro` is a simplified variant of a `@mixin` that takes no arguments and has no local variables. Its body is directly substituted at the `@apply` site.

```css
@macro --reset-list {
	margin: 0;
	padding: 0;
	list-style: none;
}

@macro --visually-hidden {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip: rect(0 0 0 0);
	white-space: nowrap;
}

.nav {
	@apply --reset-list;
}

.sr-only {
	@apply --visually-hidden;
}
```

### `@apply` — Invoking Mixins and Macros

The `@apply` rule substitutes a mixin or macro’s result into the current style rule.

```css
.foo {
	/* No arguments */
	@apply --reset-list;

	/* With arguments */
	@apply --gradient-text(hotpink, deepskyblue);

	/* With a contents block */
	@apply --responsive-wrapper {
		display: flex;
		flex-flow: column;
	}

	/* With both arguments and contents */
	@apply --card(16px) {
		background: white;
	}
}
```

### `@contents` — Caller-Provided Styles

A mixin or macro can accept a contents block from the caller using `@contents`. This lets the caller inject styles into a predefined structure.

```css
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
		grid-template-columns: 1fr 3fr;
	}
}
```

`@contents` can also specify a fallback block that is used when no contents block is passed:

```css
@mixin --card() {
	@result {
		@contents {
			padding: 1rem;
		}
	}
}

.default-card {
	@apply --card;
	/* Uses fallback: padding: 1rem */
}

.custom-card {
	@apply --card {
		padding: 2rem;
		border-radius: 8px;
	}
}
```

## Advanced Examples

### Design Tokens with Mixins

```css
@mixin --button(
	--bg <color>: #3b82f6,
	--text <color>: white,
	--radius <length>: 6px
) {
	@result {
		background-color: var(--bg);
		color: var(--text);
		border: none;
		border-radius: var(--radius);
		padding: 0.5em 1em;
		cursor: pointer;
	}
}

.btn-primary {
	@apply --button;
}

.btn-danger {
	@apply --button(#ef4444, white, 8px);
}

.btn-outline {
	@apply --button(transparent, #3b82f6);
	border: 2px solid #3b82f6;
}
```

### Responsive Layout Mixin

```css
@mixin --responsive-grid(--min-col-width: 250px, --gap: 1rem) {
	@result {
		display: grid;
		gap: var(--gap);
		grid-template-columns: repeat(
			auto-fit,
			minmax(var(--min-col-width), 1fr)
		);
	}
}

.product-grid {
	@apply --responsive-grid(300px, 2rem);
}

.photo-gallery {
	@apply --responsive-grid(200px);
}
```

### Nested Mixin Invocation

Mixins can invoke other mixins inside their `@result` blocks:

```css
@mixin --squish(
	--left-color <color>,
	--right-color <color>: var(--left-color)
) {
	@result {
		&::before {
			content: "▶";
			background-color: var(--left-color);
		}
		&::after {
			content: "◀";
			background-color: var(--right-color);
		}
	}
}

@mixin --colorized-squish(--color <color>) {
	@result {
		background-color: var(--color);
		border: 2px solid oklch(from var(--color) calc(l - 0.1) c h);
		@apply --squish(
      oklch(from var(--color) calc(l - 0.3) c h),
      oklch(from var(--color) calc(l - 0.2) c h)
    );
	}
}

.decorated {
	@apply --colorized-squish(tomato);
}
```

### Accessibility Helpers

```css
@macro --focus-ring {
	&:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
}

@macro --prefers-reduced-motion {
	@media (prefers-reduced-motion: reduce) {
		@contents {
			animation: none;
			transition: none;
		}
	}
}

.interactive {
	@apply --focus-ring;
	@apply --prefers-reduced-motion;
}
```

## CLI

Transform CSS files at build time for zero-runtime-cost output:

```bash
npx css-mixin-polyfill <input.css> [output.css] [--minify] [--stats]
```

**Options:**

| Option     | Description                     |
| ---------- | ------------------------------- |
| `--minify` | Minify the output CSS           |
| `--stats`  | Print transformation statistics |

**Examples:**

```bash
# Transform and write to a new file
npx css-mixin-polyfill src/styles.css dist/styles.css

# Transform in place with minification
npx css-mixin-polyfill styles.css --minify

# Transform and print stats
npx css-mixin-polyfill input.css output.css --stats
```

## API Reference

### `init(options)`

Initialize the polyfill. Processes existing stylesheets and watches for dynamically added ones.

```javascript
import { init } from "css-mixin-polyfill";

const polyfill = init({
	debug: false, // Enable debug logging
	autoInit: true // Automatically process existing stylesheets
});
```

Returns an object with instance methods:

```javascript
// Re-process all stylesheets
polyfill.refresh();

// Check for native browser support
polyfill.hasNativeSupport();

// Process specific CSS text
polyfill.processCSSText(cssText);
```

### `processCSSText(cssText)`

Process a string of CSS containing `@mixin`, `@macro`, and `@apply` rules. Returns the transformed CSS with all mixins and macros resolved.

```javascript
import { processCSSText } from "css-mixin-polyfill";

const result = processCSSText(`
  @macro --bold { font-weight: bold; }
  .title { @apply --bold; }
`);
// .title { font-weight: bold; }
```

### `hasNativeSupport()`

Check if the browser natively supports CSS `@mixin`, `@macro`, and `@apply` rules. When native support is available, the polyfill is not needed.

```javascript
import { hasNativeSupport } from "css-mixin-polyfill";

if (hasNativeSupport()) {
	console.log("Native CSS mixin support available!");
}
```

### `buildTimeTransform(cssText)`

Transform CSS at build time, resolving all `@mixin`, `@macro`, and `@apply` rules into plain CSS. Used internally by the CLI tool.

```javascript
import { buildTimeTransform } from "css-mixin-polyfill";

const output = buildTimeTransform(inputCSS);
```

## Browser Support

The polyfill works in all modern browsers that support:

- ES6 (ECMAScript 2015)
- CSS Object Model
- MutationObserver

**Tested browsers:**

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance

- The polyfill only activates when native CSS `@mixin` / `@macro` / `@apply` support is not available
- Build-time transformation eliminates runtime cost entirely
- Efficient CSS parsing with minimal DOM manipulation
- Caches transformation results for repeated processing

## Contributing

Please have a look at our [CONTRIBUTION guidelines](https://github.com/mfranzke/css-mixin-polyfill/blob/main/CONTRIBUTING.md).

## License

MIT License — see [LICENSE](LICENSE) file for details.

## Credits

- Pure JavaScript implementation with custom CSS parsing
- Based on the [W3C CSS Mixins specification](https://drafts.csswg.org/css-mixins/)
- Thanks to all contributors and testers

## Related

- [W3C CSS Mixins specification](https://drafts.csswg.org/css-mixins/) — the official specification
- [postcss-transform-mixins](https://github.com/mfranzke/css-mixin-polyfill/tree/main/packages/postcss-transform-mixins/) — PostCSS plugin for build-time transformation
- [stylelint-config-mixin](https://github.com/mfranzke/css-mixin-polyfill/tree/main/packages/stylelint-config-mixin) — Stylelint configuration for CSS mixin usage
