import adapter from 'sveltekit-adapter-chrome-extension';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { optimizeImports } from "carbon-preprocess-svelte";


/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(),optimizeImports()],
    kit: {
        adapter: adapter(),
        appDir: 'app',
    }
};

export default config;
