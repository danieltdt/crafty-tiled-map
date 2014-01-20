'use strict';

module.exports = TiledMap;

function TiledMap(jsonPath) {
  if (!(this instanceof TiledMap))
    return new TiledMap(jsonPath);

  this.jsonPath = jsonPath;
  this.worker = new Worker('download_json_worker.js');
}

TiledMap.prototype.download = function (fn) {
  this.worker.addEventListener('message', loadMap(fn), false);
  this.worker.postMessage('download');
};

TiledMap.prototype.onCreated = function (callback, options) {
};

function loadMap(callback) {
  return function workerListener(e) {
    var result = e.data;

    if (result.error)
      return callback(new Error('Error on loading map: ' + e));
  };
}
