/**
 * CSS Mixin/Macro Transformation Engine
 * Transforms @mixin/@macro definitions and @apply rules into native CSS
 * Based on the CSS Mixins specification: https://drafts.csswg.org/css-mixins/
 */

/* global document */

/**
 * Handle string parsing in CSS
 */
const handleStrings = (char, previousChar, parseState) => {
	if ((char === '"' || char === "'") && previousChar !== '\\') {
		if (!parseState.inString) {
			parseState.inString = true;
			parseState.stringChar = char;
		} else if (char === parseState.stringChar) {
			parseState.inString = false;
			parseState.stringChar = '';
		}
	}

	return parseState.inString;
};

/**
 * Parse CSS rules with proper handling of nested structures
 */
const parseCSSRules = (cssText) => {
	const rules = [];
	let currentRule = '';
	let braceCount = 0;
	let inRule = false;

	const parseState = {
		inString: false,
		stringChar: '',
		inComment: false
	};

	for (let i = 0; i < cssText.length; i++) {
		const char = cssText[i];
		const nextChar = cssText[i + 1];
		const previousChar = cssText[i - 1];

		// Handle comment start
		if (
			!parseState.inString &&
			!parseState.inComment &&
			char === '/' &&
			nextChar === '*'
		) {
			// If we have accumulated content before the comment and we're not inside a rule, save it
			if (currentRule.trim() && !inRule) {
				rules.push(currentRule.trim());
				currentRule = '';
			}

			parseState.inComment = true;
			currentRule += char;
			continue;
		}

		// Handle comment end
		if (parseState.inComment && char === '*' && nextChar === '/') {
			currentRule += char + nextChar;
			parseState.inComment = false;

			// Only save comment as a standalone rule if not inside a rule block
			if (!inRule) {
				rules.push(currentRule.trim());
				currentRule = '';
			}

			i++; // Skip the next character
			continue;
		}

		if (parseState.inComment) {
			currentRule += char;
			continue;
		}

		// Handle strings
		handleStrings(char, previousChar, parseState);

		// Handle braces (only when not in string)
		if (!parseState.inString) {
			if (char === '{') {
				braceCount++;
				inRule = true;
			} else if (char === '}') {
				braceCount--;
			}
		}

		currentRule += char;

		// Complete rule found
		if (inRule && braceCount === 0 && char === '}') {
			rules.push(currentRule.trim());
			currentRule = '';
			inRule = false;
		}
	}

	// Handle any remaining content
	if (currentRule.trim()) {
		rules.push(currentRule.trim());
	}

	return rules;
};

/**
 * Extract content between the outermost braces of a text
 */
const extractBraceContent = (text) => {
	const firstBrace = text.indexOf('{');
	if (firstBrace === -1) {
		return '';
	}

	let depth = 0;
	for (let i = firstBrace; i < text.length; i++) {
		if (text[i] === '{') {
			depth++;
		} else if (text[i] === '}') {
			depth--;
			if (depth === 0) {
				return text.slice(firstBrace + 1, i);
			}
		}
	}

	return '';
};

/**
 * Parse a single @mixin parameter string
 * Pattern: --name [<type>] [: default]
 */
const parseSingleParam = (paramString) => {
	const trimmed = paramString.trim();
	if (!trimmed) {
		return null;
	}

	// Match: --name, optionally followed by <type>, optionally followed by : default
	const match = trimmed.match(/^(--[\w-]+)\s*(?:<[^>]+>)?\s*(?::\s*(.+))?$/);
	if (!match) {
		return { name: trimmed, defaultValue: null };
	}

	return {
		name: match[1],
		defaultValue: match[2] ? match[2].trim() : null
	};
};

/**
 * Parse @mixin parameter list string into an array of parameter objects
 */
const parseMixinParams = (paramsString) => {
	const trimmed = paramsString.trim();
	if (!trimmed) {
		return [];
	}

	const params = [];
	let current = '';
	let depth = 0;

	for (const char of trimmed) {
		if (char === '(' || char === '<') {
			depth++;
		} else if (char === ')' || char === '>') {
			depth--;
		}

		if (char === ',' && depth === 0) {
			const param = parseSingleParam(current);
			if (param) {
				params.push(param);
			}

			current = '';
		} else {
			current += char;
		}
	}

	const lastParam = parseSingleParam(current);
	if (lastParam) {
		params.push(lastParam);
	}

	return params;
};

/**
 * Extract @result blocks from a mixin body
 */
const extractResultBlocks = (body) => {
	const blocks = [];
	let index = 0;

	while (index < body.length) {
		const resultPos = body.indexOf('@result', index);
		if (resultPos === -1) {
			break;
		}

		// Make sure it's not part of another word
		if (resultPos > 0 && /[\w-]/.test(body[resultPos - 1])) {
			index = resultPos + 7;
			continue;
		}

		// Find the opening brace after @result
		let braceStart = -1;
		for (let i = resultPos + 7; i < body.length; i++) {
			if (body[i] === '{') {
				braceStart = i;
				break;
			}

			if (!/\s/.test(body[i])) {
				break; // Non-whitespace before brace means invalid @result
			}
		}

		if (braceStart === -1) {
			index = resultPos + 7;
			continue;
		}

		// Find matching closing brace
		let depth = 0;
		let braceEnd = -1;
		for (let i = braceStart; i < body.length; i++) {
			if (body[i] === '{') {
				depth++;
			} else if (body[i] === '}') {
				depth--;
				if (depth === 0) {
					braceEnd = i;
					break;
				}
			}
		}

		if (braceEnd === -1) {
			index = resultPos + 7;
			continue;
		}

		blocks.push(body.slice(braceStart + 1, braceEnd).trim());
		index = braceEnd + 1;
	}

	return blocks;
};

/**
 * Parse a @mixin definition from its rule text
 * Returns { type, name, params, body, resultBlocks } or null if invalid
 */
const parseMixinDefinition = (ruleText) => {
	const trimmed = ruleText.trim();

	// Must match: @mixin --dashed-name(
	const nameMatch = trimmed.match(/^@mixin\s+(--[\w-]+)\s*\(/);
	if (!nameMatch) {
		return null;
	}

	const name = nameMatch[1];

	// Find closing paren of parameter list
	let parenDepth = 0;
	const paramStart = trimmed.indexOf('(') + 1;
	let paramEnd = -1;

	for (let i = paramStart; i < trimmed.length; i++) {
		if (trimmed[i] === '(') {
			parenDepth++;
		} else if (trimmed[i] === ')') {
			if (parenDepth === 0) {
				paramEnd = i;
				break;
			}

			parenDepth--;
		}
	}

	if (paramEnd === -1) {
		return null;
	}

	const paramsString = trimmed.slice(paramStart, paramEnd);
	const params = parseMixinParams(paramsString);
	const body = extractBraceContent(trimmed);
	const resultBlocks = extractResultBlocks(body);

	return { type: 'mixin', name, params, body, resultBlocks };
};

/**
 * Parse a @macro definition from its rule text
 * Returns { type, name, params, body } or null if invalid
 */
const parseMacroDefinition = (ruleText) => {
	const trimmed = ruleText.trim();

	// Must match: @macro --dashed-name {
	const nameMatch = trimmed.match(/^@macro\s+(--[\w-]+)\s*\{/);
	if (!nameMatch) {
		return null;
	}

	const name = nameMatch[1];
	const body = extractBraceContent(trimmed);

	return { type: 'macro', name, params: [], body };
};

/**
 * Split function arguments by commas, respecting nesting
 */
const splitArguments = (argumentsString) => {
	const args = [];
	let current = '';
	let depth = 0;

	for (const char of argumentsString) {
		if (char === '(' || char === '[') {
			depth++;
		} else if (char === ')' || char === ']') {
			depth--;
		}

		if (char === ',' && depth === 0) {
			args.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}

	if (current.trim()) {
		args.push(current.trim());
	}

	return args;
};

/**
 * Substitute @contents rules in body text with the provided contents block
 */
const substituteContents = (body, contentsBlock) => {
	let result = body;
	let index = 0;

	while (index < result.length) {
		const contentsPos = result.indexOf('@contents', index);
		if (contentsPos === -1) {
			break;
		}

		// Check it's not part of another word
		if (contentsPos > 0 && /[\w-]/.test(result[contentsPos - 1])) {
			index = contentsPos + 9;
			continue;
		}

		let pos = contentsPos + 9;

		// Skip whitespace
		while (pos < result.length && /\s/.test(result[pos])) {
			pos++;
		}

		let replacement;
		let endPos;

		if (pos < result.length && result[pos] === '{') {
			// @contents { fallback } form
			let depth = 0;
			let blockEnd = -1;
			for (let i = pos; i < result.length; i++) {
				if (result[i] === '{') {
					depth++;
				} else if (result[i] === '}') {
					depth--;
					if (depth === 0) {
						blockEnd = i;
						break;
					}
				}
			}

			if (blockEnd !== -1) {
				const fallbackContent = result.slice(pos + 1, blockEnd).trim();
				replacement =
					contentsBlock !== null ? contentsBlock : fallbackContent;
				endPos = blockEnd + 1;
			} else {
				replacement = contentsBlock || '';
				endPos = pos;
			}
		} else if (pos < result.length && result[pos] === ';') {
			// @contents; form (no fallback)
			replacement = contentsBlock || '';
			endPos = pos + 1;
		} else {
			replacement = contentsBlock || '';
			endPos = pos;
		}

		result =
			result.slice(0, contentsPos) + replacement + result.slice(endPos);
		index = contentsPos + replacement.length;
	}

	return result;
};

/**
 * Find @apply rules within a rule body text.
 * Returns an array of { start, end, name, args, contentsBlock }
 */
const findApplyRules = (bodyText) => {
	const applies = [];
	let index = 0;

	while (index < bodyText.length) {
		const applyPos = bodyText.indexOf('@apply', index);
		if (applyPos === -1) {
			break;
		}

		// Make sure it's not part of another word
		if (applyPos > 0 && /[\w-]/.test(bodyText[applyPos - 1])) {
			index = applyPos + 6;
			continue;
		}

		let pos = applyPos + 6; // After "@apply"

		// Skip whitespace
		while (pos < bodyText.length && /\s/.test(bodyText[pos])) {
			pos++;
		}

		// Read the name (dashed-ident)
		let name = '';
		while (pos < bodyText.length && /[\w-]/.test(bodyText[pos])) {
			name += bodyText[pos];
			pos++;
		}

		if (!name) {
			index = applyPos + 6;
			continue;
		}

		// Check for function arguments in parentheses
		let args = [];
		while (pos < bodyText.length && /\s/.test(bodyText[pos])) {
			pos++;
		}

		if (pos < bodyText.length && bodyText[pos] === '(') {
			let argDepth = 0;
			const argStart = pos + 1;
			let argEnd = -1;

			for (let i = pos; i < bodyText.length; i++) {
				if (bodyText[i] === '(') {
					argDepth++;
				} else if (bodyText[i] === ')') {
					argDepth--;
					if (argDepth === 0) {
						argEnd = i;
						break;
					}
				}
			}

			if (argEnd !== -1) {
				const argumentsString = bodyText.slice(argStart, argEnd).trim();
				if (argumentsString) {
					args = splitArguments(argumentsString);
				}

				pos = argEnd + 1;
			}
		}

		// Skip whitespace
		while (pos < bodyText.length && /\s/.test(bodyText[pos])) {
			pos++;
		}

		// Check for contents block
		let contentsBlock = null;
		let endPos;

		if (pos < bodyText.length && bodyText[pos] === '{') {
			// Parse contents block
			let blockDepth = 0;
			let blockEnd = -1;

			for (let i = pos; i < bodyText.length; i++) {
				if (bodyText[i] === '{') {
					blockDepth++;
				} else if (bodyText[i] === '}') {
					blockDepth--;
					if (blockDepth === 0) {
						blockEnd = i;
						break;
					}
				}
			}

			if (blockEnd !== -1) {
				contentsBlock = bodyText.slice(pos + 1, blockEnd).trim();
				endPos = blockEnd + 1;
			} else {
				endPos = pos;
			}
		} else if (pos < bodyText.length && bodyText[pos] === ';') {
			endPos = pos + 1;
		} else {
			// No semicolon or block - still valid per spec
			endPos = pos;
		}

		applies.push({
			start: applyPos,
			end: endPos,
			name,
			args,
			contentsBlock
		});

		index = endPos;
	}

	return applies;
};

/**
 * Substitute mixin parameters into the result body.
 * Replaces var(--paramName) with the argument value or default.
 */
const substituteParams = (body, params, args) => {
	let result = body;

	for (let i = 0; i < params.length; i++) {
		const param = params[i];
		const argValue = i < args.length ? args[i] : param.defaultValue;

		if (argValue !== null && argValue !== undefined) {
			// Replace var(--paramName) with the argument value
			// Handle var(--paramName) and var(--paramName, fallback)
			const varPattern = new RegExp(
				`var\\(\\s*${param.name}\\s*(?:,[^)]*)?\\)`,
				'g'
			);
			result = result.replace(varPattern, argValue);
		}
	}

	return result;
};

/**
 * Process @apply rules within a body text, substituting mixin/macro content
 */
const processApplyInBody = (bodyText, definitions) => {
	const applies = findApplyRules(bodyText);
	if (applies.length === 0) {
		return bodyText;
	}

	// Process from right to left to preserve string indices
	let result = bodyText;
	for (let i = applies.length - 1; i >= 0; i--) {
		const apply = applies[i];
		const definition = definitions.get(apply.name);

		if (!definition) {
			// Unknown mixin/macro - remove the @apply rule (produces nothing)
			result = result.slice(0, apply.start) + result.slice(apply.end);
			continue;
		}

		let substitution;

		if (definition.type === 'macro') {
			// Macro: direct substitution of body content
			substitution = definition.body;
			// Handle @contents substitution
			substitution = substituteContents(
				substitution,
				apply.contentsBlock
			);
		} else {
			// Mixin: substitute @result blocks with parameter handling
			if (definition.resultBlocks.length === 0) {
				// No @result blocks - mixin produces no output
				result = result.slice(0, apply.start) + result.slice(apply.end);
				continue;
			}

			// Concatenate all @result blocks
			substitution = definition.resultBlocks.join('\n');

			// Substitute parameters
			if (definition.params.length > 0) {
				substitution = substituteParams(
					substitution,
					definition.params,
					apply.args
				);
			}

			// Handle @contents substitution
			substitution = substituteContents(
				substitution,
				apply.contentsBlock
			);
		}

		// Recursively process any nested @apply rules in the substitution
		substitution = processApplyInBody(substitution, definitions);

		result =
			result.slice(0, apply.start) +
			substitution +
			result.slice(apply.end);
	}

	return result;
};

/**
 * Process a complete CSS rule, substituting any @apply rules within it
 */
const processRule = (ruleText, definitions) => {
	const trimmed = ruleText.trim();

	// Skip @mixin and @macro definitions (already extracted)
	if (trimmed.startsWith('@mixin ') || trimmed.startsWith('@macro ')) {
		return '';
	}

	// Find the body
	const firstBrace = trimmed.indexOf('{');
	if (firstBrace === -1) {
		return ruleText; // Not a rule with braces, return as-is
	}

	const lastBrace = trimmed.lastIndexOf('}');
	if (lastBrace === -1) {
		return ruleText;
	}

	const selector = trimmed.slice(0, firstBrace).trim();
	const body = trimmed.slice(firstBrace + 1, lastBrace);

	// Process @apply rules in the body
	const processedBody = processApplyInBody(body, definitions);

	// If the body is empty after processing, skip the rule
	if (!processedBody.trim()) {
		return '';
	}

	return `${selector} {\n${processedBody}\n}`;
};

/**
 * Transform CSS text containing @mixin/@macro/@apply into native CSS
 */
const transformToNativeCSS = (cssText) => {
	const rules = parseCSSRules(cssText);
	const definitions = new Map();

	// Phase 1: Extract all @mixin and @macro definitions
	for (const rule of rules) {
		const trimmed = rule.trim();

		if (trimmed.startsWith('@mixin ')) {
			const definition = parseMixinDefinition(trimmed);
			if (definition) {
				// Per spec: later definitions overwrite earlier ones in same layer
				definitions.set(definition.name, definition);
			}
		} else if (trimmed.startsWith('@macro ')) {
			const definition = parseMacroDefinition(trimmed);
			if (definition) {
				definitions.set(definition.name, definition);
			}
		}
	}

	// Phase 2: Process remaining rules, substituting @apply references
	let nativeCSS = '';

	for (const rule of rules) {
		const trimmed = rule.trim();

		// Skip definitions (already extracted)
		if (trimmed.startsWith('@mixin ') || trimmed.startsWith('@macro ')) {
			continue;
		}

		// Skip standalone comments
		if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) {
			continue;
		}

		const processed = processRule(trimmed, definitions);
		if (processed) {
			nativeCSS += processed + '\n';
		}
	}

	const totalRules = rules.filter(
		(r) =>
			!r.trim().startsWith('@mixin') &&
			!r.trim().startsWith('@macro') &&
			!r.trim().startsWith('/*')
	).length;
	const transformedApplyCount = (cssText.match(/@apply/g) || []).length;

	return {
		nativeCSS: nativeCSS.trim(),
		runtimeCSS: '',
		hasRuntimeRules: false,
		stats: {
			totalRules,
			transformedRules: transformedApplyCount
		}
	};
};

/**
 * Build-time transformation utility
 */
const buildTimeTransform = (cssText, options = {}) => {
	const { minify = false } = options;

	const result = transformToNativeCSS(cssText);

	if (minify) {
		result.nativeCSS = result.nativeCSS
			.replaceAll(/\s+/g, ' ')
			.replaceAll(/;\s*}/g, '}')
			.replaceAll(/{\s+/g, '{')
			.trim();
	}

	return result;
};

/**
 * Runtime transformation utility (for integration with the browser polyfill)
 */
const runtimeTransform = (cssText, element) => {
	const result = transformToNativeCSS(cssText);

	// Apply transformed CSS immediately if we have it
	if (result.nativeCSS && element) {
		const style = document.createElement('style');
		style.textContent = result.nativeCSS;
		style.dataset.cssMixinNative = 'true';
		document.head.append(style);
	}

	return {
		processedCSS: result.nativeCSS,
		hasRuntimeRules: false,
		nativeCSS: result.nativeCSS
	};
};

export {
	buildTimeTransform,
	extractResultBlocks,
	findApplyRules,
	parseCSSRules,
	parseMacroDefinition,
	parseMixinDefinition,
	processApplyInBody,
	runtimeTransform,
	substituteContents,
	substituteParams,
	transformToNativeCSS
};
