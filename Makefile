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

##@ Testing
test-browsers: node_modules backends/php/vendor  ## Run the browser tests in Chromium, Firefox and WebKit
	npx playwright install
	npx playwright test tests/browser

test-api: node_modules backends/php/vendor  ## Run the HTTP API tests against the PHP backend
	npx playwright test tests/api --project=chromium

test-editor-performance: node_modules  ## Run the editing performance tests, one at a time
	npx playwright install
	npx playwright test tests/editor-performance --workers=1

node_modules: package-lock.json
	@command -v npm >/dev/null || { echo "npm (comes with Node.js) is required: https://nodejs.org"; exit 1; }
	npm ci
	@touch $@

backends/php/vendor: backends/php/composer.json backends/php/composer.lock
	@command -v composer >/dev/null || { echo "composer is required: https://getcomposer.org"; exit 1; }
	composer install --working-dir=backends/php
	@touch $@
