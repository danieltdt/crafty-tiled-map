'use strict';

function createSpriteFromTileset(tileset) {
  return Crafty.sprite(
    tileset.tilewidth,
    tileset.tileheight,
    tileset.image,
    tilesetToSpriteMap(tileset),
    tileset.spacing,
    tileset.spacing
  );
}

function tilesetToSpriteMap(tileset) {
    var columns = Math.round(
      tileset.imagewidth / (tileset.tilewidth + tileset.margin)
    );
    var rows = Math.round(
      tileset.imageheight / (tileset.tileheight + tileset.margin)
    );
    var tilesMap = {};

    for (var row = 0; row < rows; row++) {
      for (var column = 0; column < columns; column++) {
        // Tiled Map Editor exports tiled maps with many tilesets images but
        // gives an unique gid for each tile. We need to create an component
        // for each tile in order to reproduce the map.
        var tileNumber =
          ((parseInt(tileset.firstgid, 10) + column) + (columns * row));

        tilesMap['Tile' + tileNumber] = [column, row];
      }
    }

    return tilesMap;
}

Crafty.c('TiledMap', {
  init: function () {
    this.onPlacePlayer(function () {});
  },

  onPlacePlayer: function (fn) {
    this.placePlayer = fn;
  },

  setTiledMap: function (tiledMap) {
    var self = this;

    self.tiledMap = tiledMap;

    // This will create sprites (which will create tile components)
    tiledMap.tilesets.forEach(createSpriteFromTileset);

    // Define layer z value (this value will be add to each entity on layer)
    tiledMap.layers.forEach(function (layer, i) { layer.z = i; });

    // Apply objects
    tiledMap.layers
    .filter(function (layer) { return layer.type === 'objectgroup'; })
    .forEach(function (layer) {
      for (var i = 0; i < layer.objects; i++) {
        var object = layer.objects[i];
        var objectType = (object.type || 'ObjectCollision');

        if (objectType === 'Player') {
          self.placePlayer.call(self, object);
        } else {
          Crafty.e('2D, Canvas, Collision, ' + objectType)
          .attr({
            x: object.x,
            y: object.y,
            w: object.width,
            h: object.height,
            z: layer.z
          })
          .collision();
        }
      }
    });
  }
});
