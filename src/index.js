'use strict';

require('./components/grid');
require('./components/tile');
require('./components/tiled_map');

module.exports = TiledMap;

function TiledMap(jsonPath, options) {
  if (!(this instanceof TiledMap))
    return new TiledMap(jsonPath, options);

  this.jsonPath = jsonPath;

  this.worker = new Worker('download_json_worker.js');
}

TiledMap.prototype.downloaded = function (fn) {
  this.worker.addEventListener('message', loadMap(this, fn), false);
  this.worker.postMessage('download');
};

function loadMap(context, callback) {
  return function workerListener(e) {
    var result = e.data;

    if (result.error)
      return callback(new Error('Error on loading map: ' + result.error));

    callback(null, result.json);
  };
}
