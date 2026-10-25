SHELL = /bin/bash
.DEFAULT_GOAL := help
HERE := $(dir $(realpath $(firstword $(MAKEFILE_LIST))))

# https://mwop.net/blog/2023-12-11-advent-makefile.html
##@ Help
help:  ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[0-9a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Demo
demo-server: backends/php/vendor  ## Serve the demo at http://localhost:27618/demo/
	@command -v php >/dev/null || { echo "php is required: https://www.php.net"; exit 1; }
	@echo "Demo: http://localhost:27618/demo/"
	php -S localhost:27618 -t $(HERE) -d upload_max_filesize=10M -d post_max_size=11M

##@ Build
.PHONY: dist
dist: node_modules  ## Minify src/ into dist/, the files for live sites
	node_modules/.bin/esbuild src/stets.js src/stets.css src/stets-content.js src/stets-content.css --minify --outdir=dist

##@ Testing
test-browsers: node_modules backends/php/vendor  ## Run the browser tests in Chromium, Firefox and WebKit
	npx playwright install
	npx playwright test tests/browser

test-api: node_modules backends/php/vendor  ## Run the HTTP API tests against the PHP backend
	npx playwright test tests/api --project=chromium

test-markdown: node_modules backends/php/vendor  ## Run the Markdown tests against the PHP backend, or the command in STETS_MARKDOWN_COMMAND
	npx playwright test tests/markdown --project=chromium

markdown-expected: backends/php/vendor  ## Write the Markdown tests' expected HTML with the PHP backend
	for file in tests/markdown/*.md; do php backends/php/markdown-cli.php < $$file | sed -E 's/(fn|fnref)-[0-9a-f]{8}-/\1-00000000-/g' > $${file%.md}.html; done
	for file in tests/markdown/raw-html/*.md; do php backends/php/markdown-cli.php --raw-html < $$file | sed -E 's/(fn|fnref)-[0-9a-f]{8}-/\1-00000000-/g' > $${file%.md}.html; done

test-editor-performance: node_modules  ## Run the editing performance tests, one at a time
	npx playwright install
	npx playwright test tests/editor-performance --workers=1

node_modules: package-lock.json
	@command -v npm >/dev/null || { echo "npm (comes with Node.js) is required: https://nodejs.org"; exit 1; }
	# No package needs its install script, and skipping them all keeps a dependency's script from running here.
	npm ci --ignore-scripts
	@touch $@

backends/php/vendor: backends/php/composer.json backends/php/composer.lock
	@command -v composer >/dev/null || { echo "composer is required: https://getcomposer.org"; exit 1; }
	composer install --working-dir=backends/php
	@touch $@
