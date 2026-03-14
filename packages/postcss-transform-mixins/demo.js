import postcss from 'postcss';
import { postcssMixinMacro } from './src/index.js';

const css = `
@macro --responsive-color {
  color: blue;
}

@macro --grid-fallback {
  display: grid;
  font-size: 1.2rem;
}

@macro --dark-card {
  background: #333;
}

.example {
  @apply --responsive-color;
  @apply --grid-fallback;
}

.card {
  @apply --dark-card;
}
`;

async function demo() {
	console.log('=== Original CSS ===');
	console.log(css);

	const result = await postcss([
		postcssMixinMacro({
			logTransformations: true
		})
	]).process(css, { from: undefined });

	console.log('\n=== Transformed CSS ===');
	console.log(result.css);
}

try {
	await demo();
} catch (error) {
	console.error(error);
}
