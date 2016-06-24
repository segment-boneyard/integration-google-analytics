'use strict';

/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var Universal = require('./universal');
var Classic = require('./classic');

/**
 * Expose `GA`
 */

var GA = module.exports = integration('Google Analytics')
  .channels(['server']);

/**
 * We require either a server side or mobile tracking ID
 */

GA.ensure(function(msg, settings) {
  if (settings.serversideTrackingId || settings.mobileTrackingId) return;
  return this.invalid('Must set either server-side or mobile tracking ID');
});

/**
 * GA requires application name with App/Screen tracking
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/screens
 */

GA.ensure(function(msg) {
  if (msg.type() !== 'screen') return;
  if (msg.proxy('context.app.name')) return;
  return this.reject('context.app.name required');
});

/**
 * Initialize
 *
 * @api private
 */

GA.prototype.initialize = function() {
  this.classic = new Classic(this.settings);
  this.universal = new Universal(this.settings);
};

/**
 * Methods
 */

GA.prototype.track = proxy('track');
GA.prototype.page = proxy('page');
GA.prototype.screen = proxy('screen');
GA.prototype.identify = proxy('identify');
GA.prototype.group = proxy('group');


/**
 * Proxy the method to classic or universal analytics.
 * @param  {String}   method  ('track', 'identify', etc.)
 * @return {Function}         the function to use
 */

function proxy(method) {
  return function(message, fn) {
    var receiver = this.settings.serversideClassic
      ? this.classic
      : this.universal;

    return typeof receiver[method] === 'function'
      ? receiver[method](message, fn)
      : setImmediate(fn);
  };
}
