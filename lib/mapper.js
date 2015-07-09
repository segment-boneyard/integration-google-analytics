'use strict';

/**
 * Module dependencies.
 */

var Track = require('segmentio-facade').Track;
var extend = require('lodash.assign');
var fmt = require('util').format;
var hash = require('string-hash');
var is = require('is');
var lookup = require('obj-case');
var parse = require('url').parse;

/**
 * Map page msg.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#page
 *
 * @api public
 * @param {Page} page
 * @param {Object} settings
 * @return {Object}
 */

exports.page = function(page, settings){
  var result = createPageDataForm(page, createCommonGAForm(page, settings));
  var ref = page.referrer();
  if (ref) result.dr = ref;
  result.dt = page.fullName();
  result.t = 'pageview';

  if (typeof url !== 'string') return result;

  return result;
};

/**
 * Map screen msg.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#screenView
 *
 * @api public
 * @param {Screen} screen
 * @param {Object} settings
 * @return {Object}
 */

exports.screen = function(screen, settings){
  var result = createCommonGAForm(screen, settings);
  result.cd = screen.name();
  result.t = 'screenview';

  return result;
};

/**
 * Track.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#event
 *
 * @api public
 * @param {Page} track
 * @param {Object} settings
 * @return {Object}
 */

exports.track = function(track, settings){
  var result = createPageDataForm(track, createCommonGAForm(track, settings));
  result.ev = Math.round(track.value() || track.revenue() || 0);
  result.el = track.proxy('properties.label') || 'event';
  result.ec = track.category() || 'All';
  result.ea = track.event();
  result.t = 'event';
  result.ni = track.proxy('properties.nonInteraction') || settings.nonInteraction;

  return result;
};

/**
 * Map Completed Order.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#ecom
 *
 *    - `t` - type
 *    - `ti` - transaction id (.orderId())
 *    - `ta` - transaction affiliation
 *    - `tr` - transaction revenue (.revenue())
 *    - `ts` - transaction shipping (.shipping())
 *    - `tt` - transaction tax (.tax())
 *    - `cu` - currency code (.currency())
 *
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object[]}
 */

exports.completedOrder = function(track, settings){
  var currency = track.currency();
  var orderId = track.orderId();
  var products = track.products();

  var transaction = createPageDataForm(track, createCommonGAForm(track, settings));
  transaction.ta = track.proxy('properties.affiliation');
  transaction.ts = track.shipping();
  transaction.tr = track.revenue();
  transaction.t = 'transaction';
  transaction.tt = track.tax();
  transaction.cu = currency;
  transaction.ti = orderId;

  products = products.map(function(product){
    product = new Track({ properties: product });
    var item = createCommonGAForm(track, settings);
    item.iq = product.quantity();
    item.iv = product.category();
    item.ip = product.price();
    item.in = product.name();
    item.ic = product.sku();
    item.cu = currency;
    item.ti = orderId;
    item.t = 'item';
    return item;
  });

  return [transaction].concat(products);
};

/**
 * Create common GA form.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#using-a-proxy-server
 *
 * @api private
 * @param {Object} track
 * @param {Object} settings
 * @return {Object}
 */

function createCommonGAForm(facade, settings){
  var library = facade.proxy('context.library');
  var trackingId = isMobile(library) ? settings.mobileTrackingId || settings.serversideTrackingId : settings.serversideTrackingId;
  var cid = hash(facade.userId() || facade.anonymousId());
  var campaign = facade.proxy('context.campaign') || {};
  var properties = facade.field('properties') || {};
  var screen = facade.proxy('context.screen') || {};
  var locale = facade.proxy('context.locale');
  var app = facade.proxy('context.app') || {};
  var traits = facade.traits();

  var options = facade.options('Google Analytics');
  if (options && is.string(options.clientId)) cid = options.clientId;

  var form = extend(
    metrics(traits, settings),
    metrics(properties, settings)
  );
  form.cid = cid;
  form.tid = trackingId;
  form.v = 1;

  // campaign
  if (campaign.name) form.cn = campaign.name;
  if (campaign.source) form.cs = campaign.source;
  if (campaign.medium) form.cm = campaign.medium;
  if (campaign.content) form.cc = campaign.content;

  // screen
  if (screen.height && screen.width) {
    form.sr = fmt('%sx%s', screen.width, screen.height);
  }

  // locale
  if (locale) form.ul = locale;

  // app
  if (app.name) form.an = app.name;
  if (app.version) form.av = app.version;
  if (app.appId) form.aid = app.appId;
  if (app.appInstallerId) form.aiid = app.appInstallerId;

  if (settings.sendUserId && facade.userId()) form.uid = facade.userId();
  if (facade.userAgent()) form.ua = facade.userAgent();
  if (facade.ip()) form.uip = facade.ip();

  return form;
}

/**
 * Adds hostname and path
 *
 * @api private
 * @param {Object} facade
 * @param {Object} form
 * @return {Object}
 */

function createPageDataForm(facade, form){
  var url = facade.proxy('properties.url') || facade.proxy('context.page.url');
  var parsed = parse(url || '');
  if (parsed.hostname) form.dh = parsed.hostname;
  if (parsed.path) form.dp = parsed.path;

  return form;
}

/**
 * Map google's custom dimensions & metrics with `obj`.
 *
 * Example:
 *
 *      metrics({ revenue: 1.9 }, { { metrics : { revenue: 'metric8' } });
 *      // => { metric8: 1.9 }
 *
 *      metrics({ revenue: 1.9 }, {});
 *      // => {}
 *
 * @api private
 * @param {Object} obj
 * @param {Object} data
 * @return {Object|null}
 */

function metrics(obj, data){
  var dimensions = data.dimensions || {};
  var metrics = data.metrics || {};
  var names = Object.keys(metrics).concat(Object.keys(dimensions));
  var ret = {};

  for (var i = 0; i < names.length; ++i) {
    var name = names[i];
    var key = shorten(metrics[name] || dimensions[name]);
    var value = lookup(obj, name) || obj[name];
    if (value == null) continue;
    if (key) ret[key] = value;
  }

  return ret;
}

/**
 * Shorten `metric\d+` or `dimension\d+` to `cm\d+`, `cd\d+`.
 *
 * Example:
 *
 *    shorten('metric99'); // => cm99
 *    shorten('dimension57'); // => cd57
 *
 * @api private
 * @param {string} name
 * @return {string}
 */

function shorten(name){
  var match = name.match(/^metric(\d+)$/);
  if (match) return 'cm' + match[1];
  match = name.match(/^dimension(\d+)$/);
  if (match) return 'cd' + match[1];
}

/**
 * Determine whether the request is being made directly on behalf of a
 * mobile device (iOS, android, Xamarin).
 *
 * @api private
 * @param {Object|String} library
 * @return {Boolean}
 */

function isMobile(library){
  if (!library) return false;
  return contains('ios') || contains('android') || contains('analytics.xamarin');

  function contains(str) {
    return name().toLowerCase().indexOf(str) !== -1;
  }

  function name() {
    return typeof library === 'string' ? library : library.name;
  }
}
