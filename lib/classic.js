'use strict';

/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var hash = require('string-hash');
var fmt = require('util').format;
var time = require('unix-time');
var is = require('is');

/**
 * Expose `GA`
 */

var GA = module.exports = integration('Google Analytics')
  .endpoint('https://ssl.google-analytics.com/__utm.gif')
  .retries(2);

/**
 * Initialize
 *
 * @api private
 */

GA.prototype.initialize = function() {
  this.version = '5.4.3';
};

/**
 * Tracks an event in google analytics
 *
 * https://developers.google.com/analytics/resources/articles/gaTrackingTroubleshooting#gifParameters
 *
 * @param {Track} track
 * @param {Function} callback
 * @api public
 */

GA.prototype.track = function(track, callback) {
  return this
    .get()
    .set(this._headers(track))
    .query(this._querystring(track))
    .query({ utmt: 'event' })
    .query({ utme: this.formatEvent(track) })
    .query({ utmni: 1 })
    .end(callback);
};

/**
 * Record a pageview, used for initializing an empty project and getting
 * it to start recording GA data
 *
 * @param {Page} page
 * @param {Function} callback
 * @api public
 */

GA.prototype.page = function(page, callback) {
  return this
    .get()
    .query(this._querystring(page))
    .query({ utmdt: page.proxy('properties.title') || '' })
    .query({ utmp: page.proxy('properties.path') || '/' })
    .set(this._headers(page))
    .end(callback);
};

/**
 * Create the gif querystring:
 *
 * https://developers.google.com/analytics/resources/articles/gaTrackingTroubleshooting#gifParameters
 * https://developers.google.com/analytics/resources/articles/gaTrackingTroubleshooting#pageNotAppearing
 *
 * @param {Facade} message
 * @return {Object}  querystring params
 * @api private
 */

GA.prototype._querystring = function(message) {
  return {
    utmhn: this.settings.domain || '',         // site domain (optional)
    utmac: this.settings.serversideTrackingId, // set our tracking id
    utmwv: this.version,                       // set the ga version
    utmcc: this._cookie(message),              // cookie request
    utmn: time(new Date()).toString(),         // prevent caching
    utmcs: '-',                                // language
    utmr: '-'                                  // referrer url
  };
};

/**
 * Set the proper headers for the cookie request
 *
 * @param  {Facade} message
 * @api private
 */

GA.prototype._headers = function(message) {
  var userAgent = message.userAgent();
  // ASCII characters have a range of 0 to 127
  if (userAgent) userAgent = userAgent.replace(/[^\x00-\x7F]/g, '?');

  return {
    'User-Agent': userAgent || 'not set'
  };
};

/**
 * Generate a cookie for the request
 *
 * @param {Facade} message
 * @return {String}
 * @api private
 */

GA.prototype._cookie = function(message) {
  var options = message.options(this.name);

  // Check whether they explicitly passed in the cookie.
  if (options) {
    // backwards compat for utmcc
    var cookie = options.cookie || options.utmcc;
    if (is.string(cookie)) return cookie;
  }

  return buildCookie(message, this.settings);
};

/**
 * Format an event with `track`.
 *
 * https://developers.google.com/analytics/resources/articles/gaTrackingTroubleshooting#gifParameters
 *
 * @param {Facade} track
 * @return {String}
 * @api private
 */

GA.prototype.formatEvent = function(track) {
  var value = track.proxy('properties.value') || track.revenue();
  var category = track.proxy('properties.category') || 'All';
  var label = track.proxy('properties.label') || 'event';
  var event = track.event();

  var formatted = fmt('5(%s*%s*%s)', category, event, label);

  if (is.number(value)) formatted += '(' + Math.round(value) + ')';

  return formatted;
};

/**
 * Builds a cookie for segment.io using a combination of:
 *
 * http://www.tutkiun.com/2011/04/a-google-analytics-cookie-explained.html
 * http://www.vdgraaf.info/wp-content/uploads/image-url-explained.txt
 * https://github.com/jgallen23/node-ga
 *
 * @param {Facade} message
 * @param {Object} settings
 * @return {String}
 * @api private
 */

function buildCookie(message) {
  /**
   * UTMA: Cookie indicating visitor information
   *
   * ex. 1.579990553.1301242771.1302852082.1302867721.40
   *
   * 1         : Domain hash, unique for each domain, can be set to '1'
   * 579990553 : Unique identifier for the user
   * 1301242771: Timestamp of time you first visited the site
   * 1302852082: Timestamp for the previous visit
   * 1302867721: Timestamp for the current visit
   * 40        : Number of sessions started
   */

  var domainHash = 1;
  var userId = hash(message.userId() || message.sessionId());
  var visits = 1;
  var now = time(new Date());

  var utma = [domainHash, userId, now, now, now, visits].join('.');

  /*
   * UTMZ: Traffic Sources cookie
   *
   * ex. 126210440.1302625640.30.3.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=page%20load%20javascript
   *
   * 126210440 :  Domain Hash
   * 1302625640 :   Timestamp when cookie was set
   * 30 : Session number
   * 3 : Campaign number
   * utmcsr=google : Campaign source
   * utmccn=(organic):  Campaign name
   * utmcmd=organic :  Campaign medium [Organic, referral, cpc and email]
   * utmctr=page%20load%20javascript : last keyword used to enter in site.
   */

  var utmz = [
    domainHash,
    now,
    1,
    1,
    'utmcsr=(none)|utmccn=(none)|utmcmd=(none)|utmcr=(none)'
  ].join('.');

  return fmt('__utma=%s; __utmz=%s;', utma, utmz);
}
