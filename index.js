(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Crafty.c('Grid', {
  init: function () {
    this.requires('2D');
  },

  // Redefine the grid properties for the current level.
  forLevel: function (level) {
    this._level = level;

    this.attr({
      w: this._level.tilewidth,
      h: this._level.tileheight
    });
  },

  // Locate this entity at the given position on the grid
  at: function (x, y) {
    if (!this._level)
      throw new Error('You must call .forLevel before');

    if (arguments.length === 0) {
      return {
        x: this.x / this.w,
        y: this.y / this.h
      };
    } else {
      this.attr({
        x: x * this.w,
        y: y * this.h
      });
      return this;
    }
  }
});

},{}],2:[function(require,module,exports){
'use strict';

Crafty.c('Tile', {
  init: function () {
    this.requires('Grid, Canvas');
  },
  setGid: function (gid) {
    this.gid = gid;

    return this;
  }
});

},{}],3:[function(require,module,exports){
'use strict';

Crafty.c('TiledMap', {
  init: function () {
    // Defines a default object builder
    this.setObjectBuilderFor('$default', function (object, layer) {
      Crafty.e('2D, Canvas, Collision, ' + object.type)
      .attr({
        x: object.x,
        y: object.y,
        w: object.width,
        h: object.height,
        z: layer.z
      })
      .collision();
    });

    return this;
  },

  setObjectBuilderFor: function (objectType, builder) {
    this._objectBuilders = (this._objectBuilders || {});
    this._objectBuilders[objectType] = builder;

    return this;
  },

  setTiledMap: function (tiledMap) {
    this.tiledMap = tiledMap;

    var z = 0;
    this.visibleLayers = this.tiledMap.layers.reduce(function (grouped, layer, i) {
      if ('visible' in layer ? layer.visible : true) {
        // Define layer z value (this value will be add to each entity on layer)
        layer.z = z++;
        grouped[layer.type] = (grouped[layer.type] || []);
        grouped[layer.type].push(layer);
      }

      return grouped;
    }, {});

    this.determineCameraSegments();

    // This will create sprites (which will create tile components)
    tiledMap.tilesets.forEach(this.createSpriteFromTileset);

    // Apply images
    (this.visibleLayers.imagelayer || []).forEach(this.createImageFromLayer);

    // Apply objects
    (this.visibleLayers.objectgroup || []).forEach(this.createObjectsOfLayer);

    return this;
  },

  createObjectsOfLayer: function (layer) {
    if (!('objects' in layer) || layer.type !== 'objectgroup')
      throw new Error('You must provide a layer of objects');

    for (var i = 0; i < layer.objects; i++) {
      var object = layer.objects[i];

      object.type = (object.type || 'ObjectCollision');

      var builder = (this._objectBuilders[object.type] ||
                     this._objectBuilders.$default);

      builder(object, layer);
    }

    return this;
  },

  createSpriteFromTileset: function (tileset) {
    return Crafty.sprite(
      tileset.tilewidth,
      tileset.tileheight,
      tileset.image,
      this.tilesetToSpriteMap(tileset),
      tileset.spacing,
      tileset.spacing
    );
  },

  tilesetToSpriteMap: function (tileset) {
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
  },

  getDataAtTile: function (x, y) {
    this.visibleLayers.tilelayer.map(function (layer) {
      return {gid: layer.data[x + y * this.tiledMap.width], z: layer.z};
    });
  },

  // Divide the camera into seagments to determine when to load/unload tiles
  determineCameraSegments: function () {
    var tiledMapEntity = this;

    var tileWidthInPx   = this.tiledMap.tilewidth;
    var tileHeightInPx  = this.tiledMap.tileheight;
    var mapWidthInTiles = this.tiledMap.width;
    var mapHeightInTiles = this.tiledMap.height;

    var viewportWidthInTiles  = Math.ceil(Crafty.viewport.width / tileWidthInPx);
    var viewportHeightInTiles = Math.ceil(Crafty.viewport.height / tileHeightInPx);

    var segmentsOnX = (this.tiledMap.properties.segmentsOnX || 3);
    var segmentsOnY = (this.tiledMap.properties.segmentsOnY || 3);

    var segmentWidthInTiles  = Math.ceil(viewportWidthInTiles / segmentsOnX);
    var segmentHeightInTiles = Math.ceil(viewportHeightInTiles / segmentsOnY);

    this.cameraSegment = {
      tilesCache: {},
      segmentsCache: {},

      mapWidthInTiles: mapWidthInTiles,
      mapHeightInTiles: mapHeightInTiles,

      segmentsOnX: segmentsOnX,
      segmentsOnY: segmentsOnY,

      segmentWidthInTiles: segmentWidthInTiles,
      segmentHeightInTiles: segmentHeightInTiles,

      segmentsPerRow: Math.ceil(mapWidthInTiles / segmentWidthInTiles),

      currentSegmentLinearPosition: -1,

      getSegmentLinearPositionAt: function (x, y) {
        var column = Math.floor(x / segmentWidthInTiles * tileWidthInPx);
        var row = Math.floor(y / segmentHeightInTiles * tileHeightInPx);

        return column + row * this.segmentsPerRow;
      },

      clearSegment: function (position) {
        if (position < 0)
          return;

        if (!this.segmentsCache[position] ||
            !this.segmentsCache[position].loaded)
          return;

        this.segmentsCache[position].loaded = false;

        setTimeout(function () {
          while (this.segmentsCache[position].tiles.length) {
            var tile = this.segmentsCache[position].tiles.pop();

            tile.visible = false;
            tile.attr({ x: -10000, y: -10000 });

            this.tilesCache[tile.gid].push(tile);
          }
        }.bind(this), 10);
      },

      loadSegment: function (position) {
        if (position < 0)
          return;

        if (this.segmentsCache[position] &&
            this.segmentsCache[position].loaded)
          return;

        if (!this.segmentsCache[position])
          this.segmentsCache[position] = {loaded: true, tiles: []};

        setTimeout(function () {
          var tileX =
            (this.currentSegmentLinearPosition % this.segmentsPerRow) *
            this.segmentWidthInTiles;

          var tileY =
            Math.ceil(this.currentSegmentLinearPosition / this.segmentsPerRow) *
            this.segmentHeightInTiles;

          var maxSegmentX = this.segmentWidthInTiles;
          var maxSegmentY = this.segmentHeightInTiles;
          var maxX = this.mapWidthInTiles;
          var maxY = this.mapHeightInTiles;

          var activateTile = function (tileData) {
            var gid = tileData.gid;

            if (!this.tilesCache[gid])
              this.tilesCache[gid] = [];

            var tile;
            if (this.tilesCache[gid].length) {
              tile = this.tilesCache[gid].pop();
              tile.visible = true;
            } else {
              tile = Crafty.e('Tile, Tile' + gid).setGid(gid);
            }
            tile.z = tileData.z;

            return tile;
          }.bind(this);

          for (var y = tileY; y < (tileY + maxSegmentY) && y < maxY && y >= 0; y++) {
            for (var x = tileX; x < (tileX + maxSegmentX) && x < maxX && x >= 0; x++) {
              var tiles = tiledMapEntity.getTilesGid(x, y).map(activateTile);

              for (var i = 0; i < tiles.length; i++) {
                tiles[i].attr({
                  x: x * tileWidthInPx,
                  y: y * tileHeightInPx
                });

                this.segmentsCache[position].tiles.push(tiles[i]);
              }
            }
          }
        }.bind(this), 10);
      },

      clearFarthestSegments: function () {
        var farOffsetY = Math.ceil(this.segmentsOnY / 2) + 1;
        var farOffsetX = Math.ceil(this.segmentsOnX / 2) + 1;

        // clear the row above and below
        for (var x = -farOffsetX; x <= farOffsetX; x++) {
          this.clearSegment(
            this.currentSegmentLinearPosition   +
            (-farOffsetY * this.segmentsPerRow) +
            x
          );

          this.clearSegment(
            this.currentSegmentLinearPosition  +
            (farOffsetY * this.segmentsPerRow) +
            x
          );
        }

        // clear the column behind and ahead
        for (var y = -(farOffsetY - 1); y <= (farOffsetY - 1); y++) {
          this.clearSegment(
            this.currentSegmentLinearPosition +
            (y * this.segmentsPerRow)         +
            farOffsetX
          );

          this.clearSegment(
            this.currentSegmentLinearPosition +
            (y * this.segmentsPerRow)         +
            -farOffsetX
          );
        }
      },

      loadNearestSegments: function () {
        var nearOffsetY = Math.ceil(this.segmentsOnY / 2);
        var nearOffsetX = Math.ceil(this.segmentsOnX / 2);

        for (var y = -nearOffsetY; y <= nearOffsetY; y++)
          for (var x = -nearOffsetX; x <= nearOffsetX; x++)
            this.loadSegment(
              this.currentSegmentLinearPosition +
              y * this.segmentsPerRow +
              x
            );
      }
    };

    return this;
  },

  moveCamera: function (x, y) {
    var newPosition = this.cameraSegment.getSegmentLinearPositionAt(x, y);

    if (this.currentSegmentLinearPosition !== newPosition) {
      this.currentSegmentLinearPosition = newPosition;

      setTimeout(this.cameraSegment.clearFarthestSegments.bind(this.cameraSegment), 0);
      setTimeout(this.cameraSegment.loadNearestSegments.bind(this.cameraSegment), 0);
    }
  }
});

},{}],4:[function(require,module,exports){
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

},{"./components/grid":1,"./components/tile":2,"./components/tiled_map":3}]},{},[4])