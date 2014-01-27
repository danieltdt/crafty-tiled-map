Tiled Map - Crafty.js plugin for Tiled Map Editor
=================================================

*Tiled Map* is a plugin for Crafty.js for loading tiled maps (from [Tiled Map
    Editor](http://www.mapeditor.org/)) and use them on a Crafty scene.

Usage
-----

```javascript
Crafty.scene('Main', function () {
  var map = new TiledMap('url/to/tiled/map.json');

  map.downloaded(function (err, json) {
    var map = Crafty.e('TiledMap')
    .setObjectBuilderFor('Player', function (object, layer) {
      Crafty.e('MyPlayer')
      .attr({
        x: object.x,
        y: object.y,
        z: layer.z,
        w: object.width,
        h: object.height
      });
    })
    .setTiledMap(json);

    Crafty('MyPlayer').bind('Move', function () {
      map.cameraSegment.moveCamera(this.x, this.y);
    });

    Crafty.viewport.follow(Crafty('MyPlayer'), 0, 0);

    Crafty.audio.stop();
    Crafty.audio.play('background/song/for/this/map', -1, 1.0);
  });
});
```

Demo
----
  WIP

Thanks
------

  This plugin is based on [Jonas Olmstead's post](http://tinymmo.blogspot.se/2013/06/tile-maps-of-unusual-size.html)
  about tiled maps and an old crafty.js component for tiled map editor (I
  couldn't find the link ): )
