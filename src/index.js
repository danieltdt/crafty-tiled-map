module.exports = TiledMap;

function TiledMap(jsonPath, callback) {
  if (!(this instanceof TiledMap))
    return new TiledMap(jsonPath, callback);
}

TiledMap.prototype.onCreated = function (callback, options) {
};
