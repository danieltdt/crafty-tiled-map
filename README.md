Tiled Map - Crafty.js plugin for Tiled Map Editor
=================================================

*Tiled Map* is a plugin for Crafty.js for loading tiled maps (from Tiled Map
    Editor) and loading them on a Crafty scene.

Usage
-----

    var map = new TiledMap('url/to/tiled/map.json');

    map.onCreated(function () {
      // do fancy things here like:
      //// Plays map bg song
      //Crafty.audio.stop();
      //Crafty.audio.play('background/song/for/this/map', -1, 1.0);
      // ...
      // When this function return, the map will be rendered.
    });
