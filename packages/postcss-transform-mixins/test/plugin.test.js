import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { describe, expect, it, vi } from 'vitest';
import {
	loadFixture,
	normalizeCSS,
	postcssFixtureTests
} from '../../../test/scripts/fixture-utils.js';
import { postcssMixinMacro } from '../src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '../../../test/fixtures');

describe('postcss-transform-mixins plugin', () => {
	async function run(input, output, options = {}) {
		const result = await postcss([postcssMixinMacro(options)]).process(
			input,
			{
				from: undefined
			}
		);
		expect(normalizeCSS(result.css)).toBe(normalizeCSS(output));
		expect(result.warnings()).toHaveLength(0);
	}

	// Generate tests for each shared fixture
	for (const { fixture, description } of postcssFixtureTests) {
		it(`should ${description}`, async () => {
			const { input, expected } = loadFixture(fixture);
			await run(input, expected);
		});
	}

	it('should work with logTransformations option', async () => {
		const { input, expected } = loadFixture('macro.simple');

		// Spy on console.log
		const logSpy = vi.spyOn(console, 'log');

		await run(input, expected, { logTransformations: true });

		expect(logSpy).toHaveBeenCalledWith(
			'[postcss-transform-mixins] Transformation statistics:'
		);
		expect(
			logSpy.mock.calls.some((call) =>
				call[0].includes('Total transformations: 1')
			)
		).toBe(true);

		logSpy.mockRestore();
	});

	it('should pass through CSS without @mixin/@macro/@apply', async () => {
		const input = '.normal { color: blue; font-size: 14px; }';

		const result = await postcss([postcssMixinMacro()]).process(input, {
			from: undefined
		});

		expect(result.css).toBe(input);
	});

	it('should properly forward the from option when processing files', async () => {
		const { input, expected } = loadFixture('macro.simple');
		const inputPath = path.join(FIXTURES_DIR, 'macro.simple.input.css');

		// Process with actual file path
		const result = await postcss([postcssMixinMacro()]).process(input, {
			from: inputPath
		});

		expect(normalizeCSS(result.css)).toBe(normalizeCSS(expected));
		expect(result.warnings()).toHaveLength(0);

		// Verify the from option was properly set in the result
		expect(result.opts.from).toBe(inputPath);
	});
});
