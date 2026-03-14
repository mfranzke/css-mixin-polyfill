#!/usr/bin/env node

/**
 * CSS mixinBuild-time Transformation CLI
 * Transforms CSS mixins to native @media/@supports rules
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { buildTimeTransform } from '../dist/index.modern.js';

const help = `
CSS mixinBuild-time Transformation CLI

Usage:
  npx css-mixin-polyfill <input.css> [output.css] [options]
  node bin/cli.js <input.css> [output.css] [options]

Options:
  --minify         Minify the output CSS
  --stats          Show transformation statistics
  --help           Show this help message

Examples:
  npx css-mixin-polyfill input.css output.css
  npx css-mixin-polyfill input.css output.css --minify --stats
  npx css-mixin-polyfill input.css --stats  (outputs to stdout)
`;

const parseArguments = () => {
	const args = process.argv.slice(2);

	if (args.includes('--help') || args.length === 0) {
		console.log(help);
		process.exit(0);
	}

	const inputFile = args[0];
	let outputFile = args[1];
	const options = {
		minify: args.includes('--minify'),
		showStats: args.includes('--stats')
	};

	// If second argument is an option, treat as stdout output
	if (outputFile && outputFile.startsWith('--')) {
		outputFile = null;
	}

	return { inputFile, outputFile, options };
};

const main = async () => {
	try {
		const { inputFile, outputFile, options } = parseArguments();

		// Read input CSS
		const inputPath = path.resolve(inputFile);
		const cssContent = await readFile(inputPath, 'utf8');

		console.log(`📖 Reading CSS from: ${inputPath}`);

		// Transform CSS
		const result = buildTimeTransform(cssContent, {
			minify: options.minify
		});

		// Show statistics if requested
		if (options.showStats && result.stats) {
			console.log('\n📊 Transformation Statistics:');
			console.log(`  Total rules processed: ${result.stats.totalRules}`);
			console.log(
				`  Rules with CSS mixintransformed: ${result.stats.transformedRules}`
			);
			console.log(
				`  Has runtime rules: ${result.hasRuntimeRules ? 'Yes' : 'No'}`
			);

			if (result.hasRuntimeRules) {
				console.log('  ⚠️  Some mixins require runtime processing');
			} else {
				console.log('  ✅ All mixins transformed to native CSS');
			}
		}

		// Combine native CSS with any remaining runtime CSS
		let finalCSS = result.nativeCSS;
		if (result.hasRuntimeRules && result.runtimeCSS) {
			finalCSS +=
				'\n\n/* Runtime-processed rules (require polyfill) */\n' +
				result.runtimeCSS;
		}

		// Output result
		if (outputFile) {
			const outputPath = path.resolve(outputFile);
			await writeFile(outputPath, finalCSS, 'utf8');
			console.log(`✅ Transformed CSS written to: ${outputPath}`);

			if (options.minify) {
				console.log('🗜️  CSS was minified');
			}
		} else {
			// Output to stdout
			console.log('\n📄 Transformed CSS:');
			console.log('─'.repeat(50));
			console.log(finalCSS);
		}

		// Show warnings if needed
		if (result.hasRuntimeRules) {
			console.log(
				'\n⚠️  Warning: Some mixins still require runtime processing.'
			);
			console.log(
				'   Make sure to include the CSS cssmixinmacropolyfill in your webpage.'
			);
		}
	} catch (error) {
		console.error('❌ Error:', error.message);
		process.exit(1);
	}
};

await main();
