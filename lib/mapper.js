
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
 * @param {Page} page
 * @param {Object} settings
 * @return {Object}
 */

exports.page = function(page, settings){
  var ret = createCommonGAForm(page, settings);
  var url = page.url();
  var ref = page.referrer();
  if (ref) ret.dr = ref;
  ret.dt = page.fullName();
  ret.t = 'pageview';

  if (typeof url !== 'string') return ret;

  var parsed = parse(url);
  ret.dh = parsed.hostname;
  ret.dp = parsed.path;
  return ret;
};

/**
 * Map screen msg.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#screenView
 *
 * @param {Screen} screen
 * @param {Object} settings
 * @return {Object}
 */

exports.screen = function(screen, settings){
  var ret = createCommonGAForm(screen, settings);
  ret.cd = screen.name();
  ret.t = 'screenview';

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
  var ret = createCommonGAForm(track, settings);
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

  var transaction = createCommonGAForm(track, settings);
  transaction.ta = track.proxy('properties.affiliation');
  transaction.ts = track.shipping();
  transaction.tr = track.revenue();
  transaction.t = 'transaction';
  transaction.tt = track.tax();
  transaction.cu = currency;
  transaction.ti = orderId;

  items = items.map(function(item){
    item = new Track({ properties: item });
    var ret = createCommonGAForm(track, settings);
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

function createCommonGAForm(facade, settings){
  var library = facade.proxy('context.library');
  var cid = hash(facade.userId() || facade.anonymousId());
  var campaign = facade.proxy('context.campaign') || {};
  var options = facade.options('Google Analytics');
  var app = facade.proxy('context.app') || {};
  var screen = facade.proxy('context.screen') || {};
  var traits = facade.traits();
  var properties = facade.field('properties') || {};
  var trackingId = isMobile(library) ? settings.mobileTrackingId || settings.serversideTrackingId : settings.serversideTrackingId;
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

  //screen
  if (screen.height && screen.width) {
    form.sr = fmt('%sx%s', screen.width, screen.height);
  }

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
 * @param {String} name
 * @return {String}
 * @api private
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

