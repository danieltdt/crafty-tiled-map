(function () {
  'use strict';

  var DOWNLOAD_TIMEOUT_IN_SECONDS = 5 * 1000;
  var cache = Object.create(null);

  function downloadJson(path) {
    // Check path
    if (!path) {
      self.postMessage({
        error: new TypeError('A valid path argument is required.')
      });
      return;
    }

    // Check if is on cache
    if (cache[path]) {
      self.postMessage({
        error: null,
        json: cache[path]
      });
      return;
    }

    // Make request
    var req = new XMLHttpRequest();
    req.open('GET', path);

    req.onload = function () {
      if (req.status === 200) {
        cache[path] = req.response;

        self.postMessage({
          error: null,
          json: req.response
        });
      }
    };

    req.onerror = function () {
      self.postMessage({
        error: new Error('Network error')
      });
    };

    req.send();

    // Handle request timeout
    setTimeout(function () {
      if (req.readyState < 4) {
        req.abort();
        self.postMessage({
          error: new Error('xhr request timed out!')
        });
      }
    }, DOWNLOAD_TIMEOUT_IN_SECONDS);
  }

  function clearJsonCache() {
    cache = {};
    self.postMessage(true);
  }

  self.addEventListener('message', function (event) {
    var msg = event.data;

    switch (msg.command) {
      case 'download': downloadJson(msg.data); break;
      case 'clearCache': clearJsonCache(); break;
      default:
        self.postMessage({error: new Error('Invalid command: ' + msg.command)});
    }
  });
}());
