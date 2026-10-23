import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	use: { baseURL: 'http://localhost:8111/' },
	webServer: { command: 'php -S localhost:8111 -d upload_max_filesize=10M -d post_max_size=11M', url: 'http://localhost:8111/demo/' },
	projects: ['chromium', 'firefox', 'webkit'].map((browserName) => ({ name: browserName, use: { browserName } })),
});
