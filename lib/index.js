
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
  .ensure('settings.serversideTrackingId')
  .channels(['server'])

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

GA.prototype.track    = proxy('track');
GA.prototype.identify = proxy('identify');
GA.prototype.alias    = proxy('alias');
GA.prototype.page     = proxy('page');

/**
 * Proxy the method to classic or universal analytics.
 * @param  {String}   method  ('track', 'identify', etc.)
 * @return {Function}         the function to use
 */

function proxy(method){
  return function(message, fn){
    var ga = this.settings.serversideClassic ? this.classic: this.universal;
    return ga[method].call(ga, message, fn);
  };
}
