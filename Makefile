all: clear browserify

clear:
	rm -f index.js

browserify:
	@./node_modules/.bin/browserify src/ -o index.js
