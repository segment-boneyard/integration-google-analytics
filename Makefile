ESLINT := node_modules/.bin/eslint
MOCHA := node_modules/.bin/mocha

TESTS = $(wildcard test/*.js)
GREP ?=.

clean:
	rm -rf coverage *.log
.PHONY: clean

distclean: clean
	rm -rf node_modules
.PHONY: distclean

node_modules: package.json $(wildcard node_modules/*/package.json)
	@npm install
	@touch $@

install: node_modules
.PHONY: install

lint: install
	@$(ESLINT) .
.PHONY: lint

fmt: install
	@$(ESLINT) --fix .
.PHONY: fmt

test: install
	@TZ=UTC $(MOCHA) $(TESTS) \
		--grep "$(GREP)" \
		--inline-diffs \
		--reporter spec \
		--timeout 20000
.PHONY: test
