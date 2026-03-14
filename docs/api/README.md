# API Documentation Overview

This directory contains supplementary API notes. The full API reference lives in the parent directory:

**[docs/API.md](../API.md)**

That document covers:

- **Core Polyfill** (`css-mixin-polyfill`) — `init()`, `processCSSText()`, `hasNativeSupport()`, `refresh()`, `buildTimeTransform()`
- **Transform Engine Exports** — `transformToNativeCSS`, `parseCSSRules`, `parseMixinDefinition`, `parseMacroDefinition`, `extractResultBlocks`, `findApplyRules`, `substituteParams`, `substituteContents`, `processApplyInBody`, and more
- **PostCSS Plugin** (`postcss-transform-mixins`) — build-time transformation of `@mixin`, `@macro`, and `@apply` rules
- **CLI Tool** — command-line interface for build-time CSS transformation
- **CSS Syntax Reference** — `@mixin`, `@macro`, `@apply`, `@result`, `@contents`, parameter handling, and last-definition-wins semantics

## Quick Example

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

```css
/* Output */
.nav {
	margin: 0;
	padding: 0;
	list-style: none;
}
```

See the [full API documentation](../API.md) for installation, usage, and detailed reference.
