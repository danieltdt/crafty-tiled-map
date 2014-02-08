Tiled Map - Crafty.js plugin for Tiled Map Editor
=================================================

*Tiled Map* is a plugin for Crafty.js for loading tiled maps (from [Tiled Map
    Editor](http://www.mapeditor.org/)) and use them on a Crafty scene.

Usage
-----

```javascript
Crafty.scene('Main', function () {
  var mapLoader = new CraftyTiledMap('url/to/tiled/map.json');

  mapLoader.downloaded(function (err, json) {
    // Errors on downloading json comes here.
    if (err) throw err;

    var map = Crafty.e('TiledMap');

    // Create entities based on json;
    map.setTiledMap(json);

    // Optionally, you can change Crafty camera to follow the given entity,
    //   caching not visible tiles.
    map.cameraFollow(Crafty('Player'));
  });
});
```

Demo
----
  WIP

Thanks
------

  This plugin is based on [Jonas Olmstead's post](http://tinymmo.blogspot.se/2013/06/tile-maps-of-unusual-size.html)
  about tiled maps; and an old crafty.js component for tiled map editor (I
  couldn't find the link ): )
