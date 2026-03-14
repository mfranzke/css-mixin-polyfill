/**
 * CSS Mixin/Macro Polyfill
 * Provides browser support for CSS @mixin, @macro, and @apply rules
 * Based on the CSS Mixins specification: https://drafts.csswg.org/css-mixins/
 */

/* global document, CSS, Node, MutationObserver */

import { transformToNativeCSS } from './transform.js';

// Global state
let polyfillOptions = {
	debug: false,
	autoInit: true
};

/**
 * Log debug messages
 */
const log = (...arguments_) => {
	if (polyfillOptions.debug) {
		console.log('[CSS Mixin and Macro Polyfill]', ...arguments_);
	}
};

/**
 * Check if browser has native CSS @mixin/@macro support
 */
const hasNativeSupport = () => {
	if (globalThis.window === undefined || !globalThis.CSS) {
		return false;
	}

	// No browser currently supports @mixin/@macro natively
	// This check can be updated when browsers add support
	return false;
};

/**
 * Check if CSS text contains @mixin, @macro, or @apply rules
 */
const containsMixinSyntax = (cssText) =>
	cssText.includes('@mixin ') ||
	cssText.includes('@macro ') ||
	cssText.includes('@apply ');

/**
 * Process CSS text by transforming @mixin/@macro/@apply rules
 */
const processCSSText = (cssText, options = {}) => {
	// Set options for this processing session
	const originalOptions = { ...polyfillOptions };
	polyfillOptions = { ...polyfillOptions, ...options };

	try {
		if (!containsMixinSyntax(cssText)) {
			return cssText;
		}

		const result = transformToNativeCSS(cssText);

		log(
			`Transformed CSS: ${result.stats.transformedRules} @apply rules processed`
		);

		return result.nativeCSS;
	} finally {
		polyfillOptions = originalOptions;
	}
};

/**
 * Process a style element by rewriting its content
 */
const processStyleElement = (styleElement) => {
	if (styleElement.dataset.cssMixinMacroPolyfillProcessed) {
		return; // Already processed
	}

	const originalContent = styleElement.textContent;
	const processedContent = processCSSText(originalContent);

	if (processedContent !== originalContent) {
		log(
			'Processing style element, original length:',
			originalContent.length
		);
		styleElement.textContent = processedContent;
		styleElement.dataset.cssMixinMacroPolyfillProcessed = 'true';
		log('Style element processed, new length:', processedContent.length);
	}
};

/**
 * Process all existing style elements
 */
const processExistingStylesheets = () => {
	// Process inline style elements
	const styleElements = document.querySelectorAll(
		'style:not([data-css-mixin-polyfill-processed])'
	);
	log(`Found ${styleElements.length} unprocessed style elements`);

	for (const styleElement of styleElements) {
		processStyleElement(styleElement);
	}

	// Process link stylesheets that we can access
	const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
	for (const linkElement of linkElements) {
		processLinkStylesheet(linkElement);
	}
};

/**
 * Process external stylesheet (if accessible)
 */
async function processLinkStylesheet(linkElement) {
	if (linkElement.dataset.cssMixinMacroPolyfillProcessed) {
		return;
	}

	// Only process same-origin stylesheets
	try {
		const url = new URL(linkElement.href);
		if (url.origin !== globalThis.location.origin) {
			log('Skipping cross-origin stylesheet:', linkElement.href);
			return;
		}

		try {
			const response = await fetch(linkElement.href);
			const cssText = await response.text();

			const processedCssText = processCSSText(cssText);

			if (processedCssText !== cssText) {
				const styleElement = document.createElement('style');
				styleElement.textContent = processedCssText;
				styleElement.dataset.cssMixinMacroPolyfillProcessed = 'true';
				styleElement.dataset.originalHref = linkElement.href;

				// Insert the style element after the link element
				linkElement.parentNode.insertBefore(
					styleElement,
					linkElement.nextSibling
				);

				// Disable the original link (but don't remove it for compatibility)
				linkElement.disabled = true;
				linkElement.dataset.cssMixinMacroPolyfillProcessed = 'true';

				log(
					'External stylesheet processed and replaced:',
					linkElement.href
				);
			}
		} catch (error) {
			log(
				'Could not fetch external stylesheet:',
				linkElement.href,
				error
			);
		}
	} catch (error) {
		log('Error processing external stylesheet:', error);
	}
}

/**
 * Observe stylesheet changes
 */
const observeStylesheetChanges = () => {
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (
					node.nodeType === Node.ELEMENT_NODE &&
					(node.tagName === 'STYLE' || node.tagName === 'LINK')
				) {
					log('New style element detected:', node.tagName);

					if (node.tagName === 'STYLE') {
						setTimeout(() => {
							processStyleElement(node);
						}, 0);
					} else if (
						node.tagName === 'LINK' &&
						node.rel === 'stylesheet'
					) {
						node.addEventListener('load', () => {
							processLinkStylesheet(node);
						});

						setTimeout(() => {
							processLinkStylesheet(node);
						}, 100);
					}
				}
			}
		}
	});

	observer.observe(document.head, {
		childList: true,
		subtree: true
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
};

/**
 * Initialize the polyfill
 */
const init = (options = {}) => {
	if (globalThis.window === undefined) {
		throw new TypeError(
			'CSS mixin/macro polyfill requires a browser environment'
		);
	}

	// Update global options
	polyfillOptions = { ...polyfillOptions, ...options };

	if (hasNativeSupport()) {
		log('Native CSS @mixin/@macro support detected, polyfill not needed');
		return;
	}

	log('Initializing CSS mixin/macro polyfill');
	processExistingStylesheets();
	observeStylesheetChanges();
};

/**
 * Public API to manually trigger processing
 */
const refresh = () => {
	processExistingStylesheets();
};

// Auto-initialize if in browser and DOMContentLoaded
if (globalThis.window !== undefined && typeof document !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			init();
		});
	} else {
		init();
	}
}

// Re-export build-time transformation
export { buildTimeTransform } from './transform.js';
export { hasNativeSupport, init, processCSSText, refresh };
