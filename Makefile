
TESTS = $(shell find test -type f -name "*.js")
SRC = $(shell find lib -type f -name "*.js")
GREP ?= .
ESLINT = node_modules/.bin/eslint

default: node_modules test-style test-cov

node_modules: package.json
	@npm install

lint: node_modules
	@$(ESLINT) $(SRC) $(TESTS)

fmt: node_modules
	@$(ESLINT) --fix $(SRC) $(TESTS)

test:
	@TZ=UTC ./node_modules/.bin/mocha $(TESTS) \
		--timeout 20000 \
		--reporter spec \
		--inline-diffs \
		--grep "$(GREP)"

test-cov:
	@TZ=UTC ./node_modules/.bin/istanbul cover \
	  node_modules/.bin/_mocha -- $(TESTS) \
			--timeout 20s \
			--reporter spec \
			--inline-diffs \
			--ui exports

test-style:
	@node_modules/.bin/jscs lib test

clean:
	rm -rf coverage node_modules *.log

.PHONY: test test-cov test-style
