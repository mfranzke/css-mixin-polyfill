# stylelint-config-mixin

A shareable [Stylelint](https://github.com/stylelint/stylelint) config to support the experimental [CSS `@mixin` and `@macro`](https://drafts.csswg.org/css-mixins/) syntax.

## What it does

This config prevents Stylelint from flagging the following at-rules as unknown:

- `@mixin` — defines a reusable, parameterized style block
- `@macro` — defines a simplified mixin without arguments or local variables
- `@apply` — invokes a mixin or macro
- `@result` — specifies the substitution result inside a `@mixin`
- `@contents` — substitutes a content block passed to a mixin or macro

```css
@mixin --gradient-text(--from <color>: mediumvioletred, --to <color>: teal) {
	@result {
		color: var(--from);

		@supports (background-clip: text) {
			background: linear-gradient(to right, var(--from), var(--to));
			color: transparent;
			background-clip: text;
		}
	}
}

@macro --reset-list {
	margin: 0;
	padding: 0;
	list-style: none;
}

h1 {
	@apply --gradient-text(pink, powderblue);
}

nav ul {
	@apply --reset-list;
}
```

## Installation

```bash
npm install --save-dev stylelint-config-mixin stylelint stylelint-config-standard
```

## Configuration

Add `stylelint-config-mixin` **after** `stylelint-config-standard` (or any other base config) in your Stylelint configuration:

```json
{
	"extends": ["stylelint-config-standard", "stylelint-config-mixin"]
}
```

## Related

- [CSS Mixins & Functions specification](https://drafts.csswg.org/css-mixins/)
- [css-mixin-polyfill](https://github.com/mfranzke/css-mixin-polyfill) — Runtime polyfill
- [postcss-transform-mixins](https://github.com/mfranzke/css-mixin-polyfill/tree/main/packages/postcss-transform-mixins) — PostCSS plugin

## License

MIT
