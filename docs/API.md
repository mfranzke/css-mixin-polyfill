# CSS Mixin/Macro Polyfill — API Documentation

Polyfill and build-time tooling for [CSS `@mixin`, `@macro`, and `@apply` rules](https://drafts.csswg.org/css-mixins/) per the W3C CSS Mixins specification.

## Installation

```bash
npm install css-mixin-polyfill
```

## CDN Usage

```html
<script
	type="module"
	src="https://cdn.jsdelivr.net/npm/css-mixin-polyfill/dist/index.modern.js"
></script>
```

## ESM Import

```javascript
import { init } from "css-mixin-polyfill";

// Initialize the polyfill
init();
```

## CommonJS Require

```javascript
const { init } = require("css-mixin-polyfill");

// Initialize the polyfill
init();
```

## API Reference

### Core Polyfill (`css-mixin-polyfill`) Methods

#### `init(options?)`

Initializes the polyfill in a browser environment. Processes all existing `<style>` and same-origin `<link rel="stylesheet">` elements, and observes the DOM for dynamically added stylesheets.

Auto-initialization happens on `DOMContentLoaded` by default. Calling `init()` explicitly gives you control over timing and options.

**Parameters:**

- `options` (optional): `{ debug?: boolean }`
    - `debug` — Log transformation details to the console (default: `false`)

**Example:**

```javascript
import { init } from "css-mixin-polyfill";

init({ debug: true });
```

#### `processCSSText(cssText, options?)`

Transform a string of CSS containing `@mixin`, `@macro`, and `@apply` rules into plain CSS.

**Parameters:**

- `cssText` (`string`) — CSS source text to process
- `options` (optional): `{ debug?: boolean }`

**Returns:** `string` — The transformed CSS

**Example:**

```javascript
import { processCSSText } from "css-mixin-polyfill";

const result = processCSSText(`
  @macro --reset-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .nav {
    @apply --reset-list;
  }
`);

// result:
// .nav {
//   margin: 0;
//   padding: 0;
//   list-style: none;
// }
```

#### `hasNativeSupport()`

Check whether the current browser natively supports `@mixin`/`@macro` rules. Returns `false` in non-browser environments.

**Returns:** `boolean`

**Example:**

```javascript
import { hasNativeSupport } from "css-mixin-polyfill";

if (!hasNativeSupport()) {
	init();
}
```

#### `refresh()`

Manually re-process all stylesheets in the document. Useful after dynamically inserting new `<style>` elements that the mutation observer may not have caught.

**Example:**

```javascript
import { refresh } from "css-mixin-polyfill";

// After programmatically adding styles
refresh();
```

### Build-time Transformation

#### `buildTimeTransform(cssText, options?)`

Transform CSS at build time. Resolves all `@mixin`, `@macro`, and `@apply` rules into native CSS so no runtime polyfill is needed.

**Parameters:**

- `cssText` (`string`) — CSS source text
- `options` (optional): `{ minify?: boolean }`

**Returns:** `TransformResult`

```typescript
interface TransformResult {
	nativeCSS: string;
	stats: {
		totalRules: number;
		transformedRules: number;
	};
}
```

**Example:**

```javascript
import { buildTimeTransform } from "css-mixin-polyfill";

const result = buildTimeTransform(`
  @mixin --gradient-text(--from, --to, --angle) {
    @result {
      background: linear-gradient(var(--angle), var(--from), var(--to));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }
  h1 {
    @apply --gradient-text(pink, powderblue, to bottom right);
  }
`);

console.log(result.nativeCSS);
// h1 {
//   background: linear-gradient(to bottom right, pink, powderblue);
//   -webkit-background-clip: text;
//   background-clip: text;
//   color: transparent;
// }

console.log(result.stats);
// { totalRules: 2, transformedRules: 1 }
```

---

### Transform Engine Exports

The transform engine is available for advanced use cases. All functions are exported from the main package under `css-mixin-polyfill`:

```javascript
import {
	transformToNativeCSS,
	parseCSSRules,
	parseMixinDefinition,
	parseMacroDefinition,
	extractResultBlocks,
	findApplyRules,
	substituteContents,
	substituteParams,
	processApplyInBody,
	buildTimeTransform,
	runtimeTransform
} from "css-mixin-polyfill";
```

| Export                                    | Description                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `transformToNativeCSS(cssText)`           | Full pipeline: parse, resolve, and emit native CSS. Returns a `TransformResult`.                                          |
| `runtimeTransform(cssText)`               | Runtime variant of the transform pipeline, used by `processCSSText`.                                                      |
| `parseCSSRules(cssText)`                  | Parse a CSS string into an array of top-level rule strings, with proper handling of nested braces, strings, and comments. |
| `parseMixinDefinition(ruleText)`          | Parse a `@mixin` rule string into a structured definition object (name, parameters, body).                                |
| `parseMacroDefinition(ruleText)`          | Parse a `@macro` rule string into a structured definition object (name, body).                                            |
| `extractResultBlocks(body)`               | Extract the contents of all `@result { … }` blocks from a mixin body.                                                     |
| `findApplyRules(cssText)`                 | Find all `@apply` invocations in a CSS string.                                                                            |
| `substituteParams(body, params, args)`    | Replace `var(--param)` references in a body with the corresponding argument values.                                       |
| `substituteContents(body, contentsBlock)` | Replace `@contents` (or `@contents { fallback }`) with the provided contents block (or the fallback if none given).       |
| `processApplyInBody(body, definitions)`   | Recursively resolve nested `@apply` rules within a body string using the given mixin/macro definitions.                   |


### PostCSS Plugin (`postcss-transform-mixins`)

PostCSS plugin that transforms `@mixin`/`@macro`/`@apply` rules at build time.

```bash
npm install postcss-transform-mixins
```

#### Usage with PostCSS

```javascript
// postcss.config.js
import postcssMixinMacro from "postcss-transform-mixins";

export default {
	plugins: [postcssMixinMacro()]
};
```

#### Plugin Options

```typescript
interface PluginOptions {
	/** Preserve original CSS alongside transformations (default: false) */
	preserveOriginal?: boolean;
	/** Log transformation statistics to console (default: false) */
	logTransformations?: boolean;
	/** Selectors to skip during transformation */
	skipSelectors?: string[];
}
```

**Example:**

```javascript
postcssMixinMacro({
	logTransformations: true
});
```

#### Input / Output

```css
/* Input */
@macro --reset-list {
	margin: 0;
	padding: 0;
	list-style: none;
}
.nav {
	@apply --reset-list;
	color: blue;
}

/* Output */
.nav {
	margin: 0;
	padding: 0;
	list-style: none;
	color: blue;
}
```

---

## CLI Tool

Build-time transformation from the command line.

```bash
npx css-mixin-polyfill <input.css> [output.css] [options]
```

### Options

| Flag       | Description                     |
| ---------- | ------------------------------- |
| `--minify` | Minify the output CSS           |
| `--stats`  | Print transformation statistics |
| `--help`   | Show usage information          |

### Examples

```bash
# Transform and write to a file
npx css-mixin-polyfill styles.css dist/styles.css

# Transform with minification and statistics
npx css-mixin-polyfill styles.css dist/styles.css --minify --stats

# Output to stdout
npx css-mixin-polyfill styles.css --stats
```


## CSS Syntax Reference

The polyfill implements the CSS `@mixin`, `@macro`, and `@apply` rules from the [CSS Mixins specification](https://drafts.csswg.org/css-mixins/).

### `@macro` — Simple Reusable Style Blocks

A macro defines a reusable block of declarations. It takes no parameters.

```css
@macro --reset-list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.foo {
	@apply --reset-list;
}
```

Produces:

```css
.foo {
	margin: 0;
	padding: 0;
	list-style: none;
}
```

### `@mixin` — Parameterised Reusable Styles

A mixin accepts parameters (with optional default values) and wraps its output in a `@result` block.

```css
@mixin --gradient-text(--from, --to, --angle: to bottom right) {
	@result {
		background: linear-gradient(var(--angle), var(--from), var(--to));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
}

h1 {
	@apply --gradient-text(pink, powderblue);
}
```

### `@apply` — Invoke a Mixin or Macro

`@apply` substitutes the mixin or macro result at the call site.

```css
/* No arguments */
.foo {
	@apply --reset-list;
}

/* With arguments */
h1 {
	@apply --gradient-text(pink, powderblue);
}

/* macro with a contents block */
body {
	@apply --one-column {
		display: flex;
		flex-flow: column;
	}
}
```

### `@contents` — Accepting a Style Block

Macros and mixins can accept an arbitrary style block passed by the caller via `@contents`. The `@contents` rule can include a fallback block.

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
		grid-template-columns: 60px 60px;
	}
}
```

Produces:

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

### Last-Definition-Wins

When multiple `@mixin` or `@macro` rules share the same name, the last definition wins (identical to how CSS handles duplicate declarations).

```css
@mixin --m1() {
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

div {
	@apply --m1;
}
/* div .cls { color: green; } */
```


## TypeScript Support

Type definitions are shipped with both packages.

```typescript
import {
	init,
	processCSSText,
	hasNativeSupport,
	buildTimeTransform,
	refresh
} from "css-mixin-polyfill";

init({ debug: true });

const css: string = processCSSText(`
  @macro --center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .hero { @apply --center; }
`);
```

```typescript
import postcssMixinMacro from "postcss-transform-mixins";
import type { PluginOptions } from "postcss-transform-mixins";

const options: PluginOptions = {
	logTransformations: true
};

postcssMixinMacro(options);
```


## Browser Support

- **Modern browsers** — Full functionality via ESM bundle or CDN
- **Legacy browsers** — CJS/UMD build available
- **No JavaScript** — Original CSS is preserved; `@mixin`/`@macro`/`@apply` rules are simply ignored by browsers that don't understand them, so base styles still apply

The polyfill auto-initialises on `DOMContentLoaded`. For server-rendered or build-time workflows, use `buildTimeTransform()` or the PostCSS plugin instead.


## Examples

See the [`/examples`](../examples/) directory for complete working demonstrations.
