import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/browser',
	use: { baseURL: 'http://localhost:8111/' },
	webServer: { command: 'php -S localhost:8111', url: 'http://localhost:8111/demo/' },
	projects: ['chromium', 'firefox', 'webkit'].map((browserName) => ({ name: browserName, use: { browserName } })),
});
