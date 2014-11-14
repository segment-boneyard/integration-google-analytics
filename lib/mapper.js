
/**
 * Module dependencies.
 */

var Track = require('segmentio-facade').Track;
var hash = require('string-hash');
var fmt = require('util').format;
var parse = require('url').parse;
var lookup = require('obj-case');
var is = require('is');

/**
 * Map page msg.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#page
 *
 * @param {Page} page
 * @param {Object} settings
 * @return {Object}
 */

exports.page = function(page, settings){
  var ret = common(page, settings);
  var url = page.url();
  ret.dt = page.fullName();
  ret.t = 'pageview';

  if ('string' != typeof url) return ret;

  var parsed = parse(url);
  ret.dh = parsed.hostname;
  ret.dp = parsed.path;
  return ret;
};

/**
 * Track.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#event
 *
 * @param {Page} track
 * @param {Object} settings
 */

exports.track = function(track, settings){
  var ret = common(track, settings);
  ret.ev = Math.round(track.value() || track.revenue() || 0);
  ret.el = track.proxy('properties.label') || 'event';
  ret.ec = track.category() || 'All';
  ret.ea = track.event();
  ret.t = 'event';
  ret.ni = track.proxy('properties.nonInteraction') || settings.nonInteraction;
  return ret;
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
 * @param {Track} track
 * @param {Object} settings
 * @return {Array[Object]} rets
 */

exports.completedOrder = function(track, settings){
  var currency = track.currency();
  var orderId = track.orderId();
  var items = track.products();

  var transaction = common(track, settings);
  transaction.ta = track.proxy('properties.affiliation');
  transaction.ts = track.shipping();
  transaction.tr = track.revenue();
  transaction.t = 'transaction';
  transaction.tt = track.tax();
  transaction.cu = currency;
  transaction.ti = orderId;

  items = items.map(function(item){
    item = new Track({ properties: item });
    var ret = common(track, settings);
    ret.iq = item.quantity();
    ret.iv = item.category();
    ret.ip = item.price();
    ret.in = item.name();
    ret.ic = item.sku();
    ret.cu = currency;
    ret.ti = orderId;
    ret.t = 'item';
    return ret;
  });

  return [transaction].concat(items);
};

/**
 * Create common ga form.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#using-a-proxy-server
 *
 * @param {Object} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

function common(facade, settings){
  var cid = hash(facade.userId() || facade.anonymousId());
  var campaign = facade.proxy('context.campaign') || {};
  var options = facade.options('Google Analytics');
  var app = facade.proxy('context.app') || {};
  var screen = facade.proxy('context.screen') || {};
  var tid = settings.serversideTrackingId;
  var traits = facade.traits();

  if (options && is.string(options.clientId)) cid = options.clientId;

  var form = metrics(traits, settings);
  form.cid = cid;
  form.tid = tid;
  form.v = 1;

  // campaign
  if (campaign.name) form.cn = fmt('(%s)', campaign.name);
  if (campaign.source) form.cs = fmt('(%s)', campaign.source);
  if (campaign.medium) form.cm = campaign.medium;
  if (campaign.content) form.cc = campaign.content;

  //screen
  if (screen.height && screen.width) {
    form.sr = fmt('%sx%s', screen.width, screen.height);
  }

  // app
  if (app.name) form.an = app.name;
  if (app.version) form.av = app.version;

  if (settings.sendUserId && facade.userId()) form.uid = facade.userId();
  if (facade.userAgent()) form.ua = facade.userAgent();
  if (facade.ip()) form.uip = facade.ip();

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
 * @param {Object} obj
 * @param {Object} data
 * @return {Object|null}
 * @api private
 */

function metrics(obj, data){
  var dimensions = data.dimensions || {};
  var metrics = data.metrics || {};
  var names = Object.keys(metrics).concat(Object.keys(dimensions));
  var ret = {};

  for (var i = 0; i < names.length; ++i) {
    var name = names[i];
    var key = metrics[name] || dimensions[name];
    var value = lookup(obj, name) || obj[name];
    if (null == value) continue;
    if (key = shorten(key)) ret[key] = value;
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
 * @param {String} name
 * @return {String}
 * @api private
 */

function shorten(name, _){
  if (_ = name.match(/^metric(\d+)$/)) return 'cm' + _[1];
  if (_ = name.match(/^dimension(\d+)$/)) return 'cd' + _[1];
}
