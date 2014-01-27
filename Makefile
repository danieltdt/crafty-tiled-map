all: clear browserify

clear:
	rm -f index.js

browserify:
	browserify src/ -o index.js
