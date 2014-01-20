all: clear browserify

clear:
	rm index.js

browserify:
	browserify src/* -o index.js
