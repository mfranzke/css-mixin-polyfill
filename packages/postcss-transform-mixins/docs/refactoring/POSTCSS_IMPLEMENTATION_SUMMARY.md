# CSS Mixin/Macro Polyfill - PostCSS Plugin Implementation Summary

## ✅ What We've Accomplished

### 1. **Workspace Structure Transformation**

- Converted from single package to npm workspaces monorepo
- Created two distinct packages:
    - `packages/css-mixin-polyfill/` - Core polyfill with runtime + build-time processing
    - `packages/postcss-transform-mixins/` - PostCSS plugin for build-time transformation

### 2. **PostCSS Plugin Development**

- **File**: `packages/postcss-transform-mixins/src/index.js`
- **Features**:
    - Integrates with PostCSS ecosystem
    - Uses the css-mixin-polyfill transformation engine (`buildTimeTransform`)
    - Supports plugin options (`logTransformations`)
    - Extracts `@mixin`/`@macro` definitions and substitutes `@apply` rules
    - Replaces the entire PostCSS root with the transformed CSS output
    - Complete error handling and validation

### 3. **Plugin Configuration**

- **Package.json**: Complete package configuration with proper dependencies
- **TypeScript Definitions**: Full type definitions in `src/index.d.ts`
- **Documentation**: Comprehensive README with usage examples
- **Test Suite**: Complete test coverage for all transformation scenarios

### 4. **Integration Examples**

- Vite configuration
- Webpack setup
- Next.js integration
- Build tool compatibility

### 5. **Monorepo Setup**

- Root package.json configured for workspaces
- Shared development dependencies
- Coordinated build and test scripts
- Proper workspace dependency management

## 🔧 PostCSS Plugin Features

### **Core Functionality**

```js
import { postcssMixinMacro } from "postcss-transform-mixins";

const result = await postcss([
	postcssMixinMacro({
		logTransformations: true
	})
]).process(css, { from: undefined });
```

### **Detection**

The plugin checks whether the CSS contains any `@mixin`, `@macro`, or `@apply` rules before attempting transformation. If none are found, the CSS is returned unchanged.

### **Transformation Examples**

#### Macro (Simple Substitution)

##### Input CSS

```css
@macro --reset-list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.nav {
	@apply --reset-list;
	display: flex;
}
```

##### Output CSS

```css
.nav {
	margin: 0;
	padding: 0;
	list-style: none;
	display: flex;
}
```

#### Mixin (With Parameters)

##### Input CSS

```css
@mixin --gradient-text(
	--from <color>: mediumvioletred,
	--to <color>: teal,
	--angle: to bottom right
) {
	--gradient: linear-gradient(var(--angle), var(--from), var(--to));
	@result {
		color: var(--from, var(--to));

		@supports (background-clip: text) or (-webkit-background-clip: text) {
			background: var(--gradient, var(--from));
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

##### Output CSS

```css
h1 {
	color: pink;
}

@supports (background-clip: text) or (-webkit-background-clip: text) {
	h1 {
		background: linear-gradient(to bottom right, pink, powderblue);
		color: transparent;
		-webkit-background-clip: text;
		background-clip: text;
	}
}
```

### **Advanced Features**

- **`@mixin` with parameters**: Accepts typed parameters with default values, local variables, and `@result` blocks
- **`@macro` without parameters**: Simple substitution of declaration blocks
- **`@apply` with contents blocks**: Pass style blocks into mixins via `@contents`
- **Nested `@apply`**: Mixins can invoke other mixins within their `@result`
- **Error Handling**: Graceful handling of malformed CSS
- **Statistics Logging**: Optional transformation statistics output via `logTransformations`

## 📂 Project Structure

```text
css-mixin-polyfill/
├── packages/
│   ├── css-mixin-polyfill/           # Core polyfill package
│   │   ├── src/
│   │   │   ├── index.js           # Main polyfill with hybrid processing
│   │   │   ├── transform.js       # Transformation engine
│   │   │   └── index.d.ts         # TypeScript definitions
│   │   ├── bin/
│   │   │   └── cli.js             # Command-line tool
│   │   ├── test/                   # Comprehensive test suite
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── postcss-transform-mixins/   # PostCSS plugin package
│       ├── src/
│       │   ├── index.js            # PostCSS plugin implementation
│       │   └── index.d.ts          # TypeScript definitions
│       ├── test/
│       │   └── plugin.test.js      # Plugin test suite
│       ├── package.json
│       └── README.md
│
├── test/
│   └── fixtures/                   # Shared fixture pairs (.input.css / .expected.css)
├── examples/                       # Demo HTML files
├── docs/                           # Documentation
├── package.json                    # Root workspace configuration
└── README.md                       # Main documentation
```

## 🚀 Usage Scenarios

### **1. Build-time Transformation (PostCSS)**

Use the PostCSS plugin to resolve `@mixin`/`@macro`/`@apply` at build time, producing native CSS output:

```css
/* Input */
@macro --visually-hidden {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}

.sr-only {
	@apply --visually-hidden;
}
```

```css
/* Output */
.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}
```

### **2. Parameterised Mixins**

Mixins accept typed parameters with defaults, enabling reusable, configurable style blocks:

```css
@mixin --button-variant(--bg <color>: royalblue, --text <color>: white) {
	@result {
		background-color: var(--bg);
		color: var(--text);
		border: 2px solid var(--bg);
	}
}

.btn-primary {
	@apply --button-variant;
}

.btn-danger {
	@apply --button-variant(crimson, white);
}
```

### **3. Contents Blocks**

Use `@contents` to let callers inject arbitrary style blocks into mixins:

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

## 🎯 Benefits Achieved

### **Performance**

- ✅ Zero runtime overhead — all transformations happen at build time
- ✅ Native CSS output for optimal browser performance
- ✅ No JavaScript required in production

### **Developer Experience**

- ✅ Familiar PostCSS plugin API
- ✅ Comprehensive TypeScript support
- ✅ Clear documentation and examples
- ✅ Simple configuration (`logTransformations` for debugging)

### **Standards Compliance**

- ✅ Follows the CSS Mixins specification (`@mixin`, `@macro`, `@apply`)
- ✅ Outputs standard CSS rules
- ✅ Works in all browsers without runtime polyfill

### **Ecosystem Integration**

- ✅ Works with all PostCSS-compatible build tools
- ✅ Vite, Webpack, Rollup, Parcel support
- ✅ Framework-agnostic (React, Vue, Svelte, etc.)

## 🔄 How the Plugin Works

1. **Detection**: The plugin scans the CSS for `@mixin`, `@macro`, or `@apply` rules. If none are found, it returns early.
2. **Transformation**: The full CSS text is passed to `buildTimeTransform()` from the `css-mixin-polyfill` package, which extracts definitions and substitutes `@apply` rules.
3. **Replacement**: The original PostCSS root is cleared and replaced with the transformed CSS output.
4. **Logging** (optional): When `logTransformations` is enabled, transformation statistics are logged to the console.
