'use strict';

Crafty.c('TiledMap', {
  init: function () {
    // Defines a default object builder
    this.setObjectBuilderFor('$default', function (object, layer) {
      var objectEntity =
        Crafty.e('2D, Canvas, Collision, Grid ' + object.type)
        .attr({
          x: object.x,
          y: object.y,
          w: object.width,
          h: object.height,
          z: layer.z
        });

      if ('polyline' in object) {
        var polygon =
          new Crafty.polygon(object.polyline.map(function (point) {
            return [point.x, point.y];
          }));

        objectEntity.collision(polygon);
      } else {
        objectEntity.collision();
      }
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

  cameraFollow: function () {
    var args = Array.prototype.slice.call(arguments);
    var entity = args[0];
    var self = this;

    self.determineCameraSegments();

    entity.bind('Move', function () {
      self.cameraSegment.moveCamera(this.x, this.y);
    });

    Crafty.viewport.follow.apply(Crafty.viewport, args);
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
