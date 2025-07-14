# Makefile for PromptShield

.PHONY: install test lint scan format help

## Install dependencies
install:
	npm install

## Run all tests
test:
	npm test

## Run linter (if configured)
lint:
	npm run lint || echo "No linter configured."

## Format code (if configured)
format:
	npm run format || echo "No formatter configured."

## Example scan using sample RulePack and fixture
scan:
	node dist/cli/index.js scan tests/fixtures/sample.txt --rulepack rulepacks/pii.yaml

## Show help
help:
	@echo "Available targets:"
	@echo "  install   Install dependencies"
	@echo "  test      Run all tests"
	@echo "  lint      Run linter (if configured)"
	@echo "  format    Format code (if configured)"
	@echo "  scan      Run sample scan with PII RulePack"
	@echo "  help      Show this help message"
