SHELL = /bin/bash
.DEFAULT_GOAL := help
HERE := $(dir $(realpath $(firstword $(MAKEFILE_LIST))))

# https://mwop.net/blog/2023-12-11-advent-makefile.html
##@ Help
help:  ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[0-9a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Testing
test-browsers: node_modules  ## Run the browser tests in Chromium, Firefox and WebKit
	npx playwright install
	npx playwright test

node_modules: package-lock.json
	@command -v npm >/dev/null || { echo "npm (comes with Node.js) is required: https://nodejs.org"; exit 1; }
	npm ci
	@touch $@
