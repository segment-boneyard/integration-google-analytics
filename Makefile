
TESTS = $(wildcard test/*.js)
SRC = $(wildcard lib/*.js)
GREP ?=.

default: node_modules test-style test-cov

node_modules: package.json
	@npm install 

test:
	@TZ=UTC ./node_modules/.bin/mocha $(TESTS) \
		--timeout 20000 \
		--require should \
		--reporter spec \
		--inline-diffs \
		--grep "$(GREP)"

test-cov:
	@TZ=UTC ./node_modules/.bin/istanbul cover \
	  node_modules/.bin/_mocha -- $(TESTS) \
			--timeout 20s \
			--require should \
			--reporter spec \
			--inline-diffs \
			--ui exports

test-style:
	@node_modules/.bin/jscs lib test

clean:
	rm -rf coverage node_modules *.log

.PHONY: test test-cov test-style
