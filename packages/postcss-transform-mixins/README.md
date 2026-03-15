# postcss-transform-mixins

[![Default CI/CD Pipeline](https://github.com/mfranzke/css-mixin-polyfill/actions/workflows/default.yml/badge.svg)](https://github.com/mfranzke/css-mixin-polyfill/actions/workflows/default.yml)
[![npm version](https://badge.fury.io/js/postcss-transform-mixins.svg)](https://badge.fury.io/js/postcss-transform-mixins)
[![Build Status](https://github.com/mfranzke/css-mixin-polyfill/workflows/CI/badge.svg)](https://github.com/mfranzke/css-mixin-polyfill/actions)

A [PostCSS](https://postcss.org/) plugin for transforming [CSS `@mixin`, `@macro`, and `@apply` rules](https://drafts.csswg.org/css-mixins/) at build time.

This plugin is part of the [css-mixin-polyfill](https://github.com/mfranzke/css-mixin-polyfill/tree/main/packages/css-mixin-polyfill/) project and provides build-time processing of CSS mixin and macro definitions, substituting `@apply` rules with the corresponding resolved styles — eliminating the need for runtime JavaScript processing.

<!-- FIXTURE: macro.basic -->

<!-- Note: This content is automatically generated from test fixtures. Do not edit the code blocks directly - they will be overwritten during the build process. To modify test cases, edit the corresponding .input.css and .expected.css files in the test/fixtures/ directory -->

**Input CSS:**

```css
@macro --reset-list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.nav {
	@apply --reset-list;
}
```

**Expected Output:**

```css
.nav {
	margin: 0;
	padding: 0;
	list-style: none;
}
```

<!-- /FIXTURE -->
## Installation

```bash
npm install postcss-transform-mixins postcss
```

## Usage

### PostCSS CLI

```bash
# Transform CSS using PostCSS CLI
npx postcss input.css --output output.css --use postcss-transform-mixins

# With custom PostCSS config file
npx postcss input.css --output output.css --config postcss.config.js
```

### Basic Programmatic Usage

```js
// Named export (recommended)
import postcss from "postcss";
import { postcssMixinMacro } from "postcss-transform-mixins";

// Or default export (for compatibility)
import postcss from "postcss";
import postcssMixinMacro from "postcss-transform-mixins";

const css = `
@mixin --gradient-text(--from <color>: mediumvioletred, --to <color>: teal) {
  @result {
    color: var(--from);
  }
}

h1 {
  @apply --gradient-text(pink, powderblue);
}
`;

const result = await postcss([postcssMixinMacro()]).process(css, {
	from: undefined
});

console.log(result.css);
```

**Output:**

```css
h1 {
	color: pink;
}
```

### With Options

```js
const result = await postcss([
	postcssMixinMacro({
		logTransformations: true
	})
]).process(css, { from: undefined });
```

### With PostCSS Config File

```js
// postcss.config.js
import { postcssMixinMacro } from "postcss-transform-mixins";

export default {
	plugins: [
		postcssMixinMacro({
			logTransformations: process.env.NODE_ENV === "development"
		})
	]
};
```

### With Popular PostCSS Tools

#### Vite

```js
// vite.config.js
import { defineConfig } from "vite";
import { postcssMixinMacro } from "postcss-transform-mixins";

export default defineConfig({
	css: {
		postcss: {
			plugins: [
				postcssMixinMacro({
					logTransformations: process.env.NODE_ENV === "development"
				})
			]
		}
	}
});
```

#### Webpack

```js
// webpack.config.js
module.exports = {
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					"style-loader",
					"css-loader",
					{
						loader: "postcss-loader",
						options: {
							postcssOptions: {
								plugins: [
									[
										"postcss-transform-mixins",
										{
											logTransformations: true
										}
									]
								]
							}
						}
					}
				]
			}
		]
	}
};
```

#### Next.js

```js
// next.config.js
module.exports = {
	experimental: {
		postcss: {
			plugins: {
				"postcss-transform-mixins": {
					logTransformations: process.env.NODE_ENV === "development"
				}
			}
		}
	}
};
```

## Options

| Option               | Type      | Default | Description                                         |
| -------------------- | --------- | ------- | --------------------------------------------------- |
| `logTransformations` | `boolean` | `false` | Whether to log transformation statistics to console |

## Supported Transformations

### Macros

Macros provide simple, literal substitution of a block of styles at each `@apply` site.

<!-- FIXTURE: macro.basic -->

<!-- Note: This content is automatically generated from test fixtures. Do not edit the code blocks directly - they will be overwritten during the build process. To modify test cases, edit the corresponding .input.css and .expected.css files in the test/fixtures/ directory -->

**Input CSS:**

```css
@macro --reset-list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.nav {
	@apply --reset-list;
}
```

**Expected Output:**

```css
.nav {
	margin: 0;
	padding: 0;
	list-style: none;
}
```

<!-- /FIXTURE -->

### Mixins

Mixins extend macros with support for parameters, default values, local variables, and `@result` blocks.

**Input CSS:**

```css
@mixin --gradient-text(
	--from <color>: mediumvioletred,
	--to <color>: teal,
	--angle: to bottom right
) {
	@result {
		color: var(--from, var(--to));

		@supports (background-clip: text) or (-webkit-background-clip: text) {
			background: linear-gradient(var(--angle), var(--from), var(--to));
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

**Expected Output:**

```css
h1 {
	color: var(--from, var(--to));

	@supports (background-clip: text) or (-webkit-background-clip: text) {
		background: linear-gradient(var(--angle), var(--from), var(--to));
		color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
	}
}
```

### Macros with `@contents`

Macros (and mixins) can accept a contents block via `@contents`, allowing callers to inject styles into a predefined structure.

<!-- FIXTURE: macro.contents -->

<!-- Note: This content is automatically generated from test fixtures. Do not edit the code blocks directly - they will be overwritten during the build process. To modify test cases, edit the corresponding .input.css and .expected.css files in the test/fixtures/ directory -->

**Input CSS:**

```css
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
}
```

**Expected Output:**

```css
body {
	@media (width <= 800px) {
		display: flex;
		flex-flow: column;
	}
}
```

<!-- /FIXTURE -->
## Limitations

- **Static Analysis Only**: The plugin performs static analysis at build time and cannot handle dynamically generated CSS or runtime-dependent values
- **PostCSS Compatibility**: Requires PostCSS 8.0.0 or higher

## Integration with Runtime Polyfill

For complete CSS `@mixin`/`@macro`/`@apply` support — including runtime evaluation, hygienic variable renaming, and dynamic argument resolution — combine this plugin with the runtime polyfill:

1. Use this PostCSS plugin for build-time transformation of `@mixin`, `@macro`, and `@apply` rules
2. Use [css-mixin-polyfill](https://github.com/mfranzke/css-mixin-polyfill/tree/main/packages/css-mixin-polyfill/) runtime for full browser-side support

```html
<!-- For full runtime mixin/macro support -->
<script src="https://cdn.jsdelivr.net/npm/css-mixin-polyfill/dist/index.modern.js"></script>
```

## Performance Considerations

This plugin is designed for optimal build-time performance, transforming CSS `@mixin` and `@macro` definitions and resolving `@apply` rules into native CSS without runtime overhead.

For most typical usage scenarios, the performance is excellent and the overhead is negligible compared to the benefits of build-time transformation.

## Contributing

See the main [Contributing Guide](https://github.com/mfranzke/css-mixin-polyfill/blob/main/CONTRIBUTING.md) for details on how to contribute to this project.

## License

MIT © [Maximilian Franzke](https://github.com/mfranzke)

## Related

- [PostCSS](https://postcss.org/) - Tool for transforming CSS with JavaScript
- [CSS Mixins & Functions](https://drafts.csswg.org/css-mixins/) - CSS specification for `@mixin`, `@macro`, and `@apply`

## Further solutions

- [css-mixin-polyfill](https://github.com/mfranzke/css-mixin-polyfill/tree/main/packages/css-mixin-polyfill/) - Runtime polyfill for CSS mixins
- [stylelint-config-mixin](https://github.com/mfranzke/css-mixin-polyfill/tree/main/packages/stylelint-config-mixin) - Stylelint configuration for linting CSS mixin usage
