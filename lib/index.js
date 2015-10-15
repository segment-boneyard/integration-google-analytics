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

GA.ensure(function(msg, settings){
  if (settings.serversideTrackingId || settings.mobileTrackingId) return;
  return this.reject('Must set either server-side or mobile tracking ID');
});

/**
 * Initialize
 *
 * @api private
 */

GA.prototype.initialize = function(){
  this.classic = new Classic(this.settings);
  this.universal = new Universal(this.settings);
};

/**
 * Methods
 */

GA.prototype.track = proxy('track');
GA.prototype.page = proxy('page');
GA.prototype.screen = proxy('screen');

/**
 * Proxy the method to classic or universal analytics.
 * @param  {String}   method  ('track', 'identify', etc.)
 * @return {Function}         the function to use
 */

function proxy(method){
  return function(message, fn){
    var receiver = this.settings.serversideClassic 
      ? this.classic 
      : this.universal;
      
    return 'function' === typeof receiver[method]
      ? receiver[method](message, fn)
      : setImmediate(fn);
  };
}
