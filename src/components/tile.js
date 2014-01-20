Crafty.c('Tile', {
  init: function () {
    this.requires('Grid, Canvas');
  },
  setGid: function (gid) {
    this.gid = gid;

    return this;
  }
});
