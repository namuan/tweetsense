export PROJECTNAME=$(shell basename "$(PWD)")

.SILENT: ;               # no need for @

setup: ## Setup Virtual Env
	python3.11 -m venv venv
	./venv/bin/pip3 install -r requirements.txt
	./venv/bin/python3 -m pip install --upgrade pip

deps: ## Install dependencies
	./venv/bin/pip3 install --upgrade -r requirements.txt
	./venv/bin/python3 -m pip install --upgrade pip
	cd chrome_extension; npm install

clean: ## Clean
	find . -type d -name '__pycache__' | xargs rm -rf
	rm -rf build dist
	rm -rf chrome_extension/bundled

build-extension: clean ## Build extension
	cd chrome_extension; npx parcel build
	echo "✅ Load chrome_extension/bundled folder as unpacked extension in Chrome"

build: build-extension ## Build package
	echo "✅ Done"

run: build ## Run python flask application
	./venv/bin/python3 tweet-sentiment.py

.PHONY: help
.DEFAULT_GOAL := help

help: Makefile
	echo
	echo " Choose a command run in "$(PROJECTNAME)":"
	echo
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
	echo
