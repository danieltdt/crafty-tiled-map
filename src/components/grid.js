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
