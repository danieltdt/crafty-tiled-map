'use strict';

require('./components/grid');
require('./components/tile');
require('./components/tiled_map');

function loadMap(context, callback) {
  return function workerListener(e) {
    var result = e.data;

    if (result.error)
      return callback(new Error('Error on loading map: ' + result.error));

    callback(null, result.json);
  };
}

function CraftyTiledMap(jsonPath, options) {
  if (!(this instanceof CraftyTiledMap))
    return new CraftyTiledMap(jsonPath, options);

  this.jsonPath = jsonPath;
  this.workerPath =
    ('/bower_components/crafty-tiled-map/download_json_worker.js' ||
     options.workerPath);

  this.worker = new Worker(this.workerPath);
}

CraftyTiledMap.prototype.downloaded = function craftyTiledMapDownloaded(fn) {
  this.worker.addEventListener('message', loadMap(this, fn), false);
  this.worker.postMessage({command: 'download', data: this.jsonPath});
};

module.exports = CraftyTiledMap;

Crafty.TiledMap = CraftyTiledMap;
