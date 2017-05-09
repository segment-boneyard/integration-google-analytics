'use strict';

/**
 * Module dependencies.
 */

var Track = require('segmentio-facade').Track;
var extend = require('@ndhoule/extend');
var fmt = require('util').format;
var foldl = require('@ndhoule/foldl');
var hash = require('string-hash');
var is = require('is');
var lookup = require('obj-case');
var parse = require('url').parse;
var pick = require('@ndhoule/pick');
var values = require('@ndhoule/values');

/**
 * Map Page.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#page
 *
 * @api public
 * @param {Page} page
 * @param {Object} settings
 * @return {Object}
 */

exports.page = function(page, settings) {
  var result = createPageDataForm(page, createCommonGAForm(page, settings));
  var ref = page.referrer();
  if (ref) result.dr = ref;
  result.dt = page.fullName();
  result.t = 'pageview';
  return result;
};

/**
 * Map Screen.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#screenView
 *
 * @api public
 * @param {Screen} screen
 * @param {Object} settings
 * @return {Object}
 */

exports.screen = function(screen, settings) {
  var result = createCommonGAForm(screen, settings);
  result.cd = screen.name();
  result.t = 'screenview';

  return result;
};

/**
 * Map Track.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#event
 *
 * @api public
 * @param {Page} track
 * @param {Object} settings
 * @return {Object}
 */

exports.track = function(track, settings) {
  var ni = track.proxy('properties.nonInteraction') || settings.nonInteraction;
  var result = createPageDataForm(track, createCommonGAForm(track, settings));
  result.ev = Math.round(track.value() || track.revenue() || 0);
  result.el = track.proxy('properties.label') || 'event';
  result.ec = track.category() || 'All';
  result.ea = track.event();
  result.t = 'event';
  if (ni) result.ni = 1;

  return result;
};

/**
 * Map Standard Order Completed.
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

exports.orderCompleted = function(track, settings) {
  var currency = track.currency();
  var orderId = track.orderId();
  var products = track.products();

  // regular event payload
  var event = exports.track(track, settings);

  // transaction payload
  var transaction = createPageDataForm(track, createCommonGAForm(track, settings));
  transaction.ta = track.proxy('properties.affiliation');
  transaction.ts = track.shipping();
  transaction.tr = track.revenue();
  transaction.t = 'transaction';
  transaction.tt = track.tax();
  transaction.cu = currency;
  transaction.ti = orderId;

  // product payloads
  products = products.map(function(product) {
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

  return [event, transaction].concat(products);
};

/**
 * Map Install Attributed (Mobile)
 */

exports.installAttributed = function(track, settings) {
  return extend(
    formatMobileCampaignEvent(track, settings),
    createCommonGAForm(track, settings, true),
    formatPage(track)
  );
}

/**
 * Map Push Notification Received (Mobile)
 */

exports.pushNotificationReceived = function(track, settings) {
  return extend(
    formatMobileCampaignEvent(track, settings),
    createCommonGAForm(track, settings, true),
    formatPage(track)
  );
}

/**
 * Map Push Notification Tapped (Mobile)
 */

exports.pushNotificationTapped = function(track, settings) {
  return extend(
    formatMobileCampaignEvent(track, settings),
    createCommonGAForm(track, settings, true),
    formatPage(track)
  );
}

/**
 * Map Push Notification Bounced (Mobile)
 */

exports.pushNotificationBounced = function(track, settings) {
  return extend(
    formatMobileCampaignEvent(track, settings),
    createCommonGAForm(track, settings, true),
    formatPage(track)
  );
}

/**
 * Map Product Viewed (Enhanced).
 */

exports.productViewed = function(track, settings) {
  return extend(
    formatEnhancedEcommerceEvent(track, 'detail'),
    createCommonGAForm(track, settings),
    formatPage(track),
    formatProduct(track.properties())
  );
};

/**
 * Map Product Clicked (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Properties:
 *    - cid
 *    - ea
 *    - ec
 *    - pa
 *    - pr1ca
 *    - pr1id
 *    - pr1nm
 *    - pr1pr
 *    - pr1qty
 *    - t
 *    - tid
 *    - v
 */

exports.productClicked = function(track, settings) {
  return extend(
    formatEnhancedEcommerceEvent(track, 'click'),
    createCommonGAForm(track, settings),
    formatPage(track),
    formatProduct(track.properties())
  );
};

/**
 * Map Product Added (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required properties:
 *    - cid
 *    - ea
 *    - ec
 *    - pa
 *    - pr1ca
 *    - pr1id
 *    - pr1nm
 *    - pr1pr
 *    - pr1qty
 *    - t
 *    - tid
 *    - v
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.productAdded = function(track, settings) {
  return extend(
    formatEnhancedEcommerceEvent(track, 'add'),
    createCommonGAForm(track, settings),
    formatPage(track),
    formatProduct(track.properties())
  );
};

/**
 * Map Product Removed (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required properties:
 *    - cid
 *    - ea
 *    - ec
 *    - pa
 *    - pr1ca
 *    - pr1id
 *    - pr1nm
 *    - pr1pr
 *    - pr1qty
 *    - t
 *    - tid
 *    - v
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.productRemoved = function(track, settings) {
  return extend(
    formatEnhancedEcommerceEvent(track, 'remove'),
    createCommonGAForm(track, settings),
    formatPage(track),
    formatProduct(track.properties())
  );
};

/**
 * Map Order Started (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required parameters:
 *    - cid      (set in createcommonGAForm)
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *    - ea       ('Started Order') // set in formatEnhancedEcommerceEvent
 *    - ec       (.properties.category || 'EnhancedEcommerce') // set in formatEnhancedEcommerceEvent
 *    - el       (.properties.category || 'event') // set in formatEnhancedEcommerceEvent
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.checkoutStarted = function(track, settings) {
  return exports.checkoutStepViewed(track, settings);
};

/**
 * Map Order updated (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#checkout-steps
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required parameters:
 *    - cid      (set in createcommonGAForm)
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *    - pa       ('checkout')
 *    - ea       ('Updated Order') // set in formatEnhancedEcommerceEvent
 *    - ec       (.properties.category || 'EnhancedEcommerce') // set in formatEnhancedEcommerceEvent
 *    - el       (.properties.category || 'event') // set in formatEnhancedEcommerceEvent
 *    - pr{x}{x} (.properties.products[x].z)
 *    - t        ('event')
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.orderUpdated = function(track, settings) {
  return exports.checkoutStepViewed(track, settings);
};

/**
 * Map Checkout Step Completed (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required parameters:
 *    - cid      (set in createcommonGAForm)
 *    TODO: Is this option, or options?
 *    - col      (.properties.option(s?))
 *    - cos      (.properties.step)
 *    - ea       (.event)
 *    - ec       (.category)
 *    - pa       ('checkout_option')
 *    - t        ('event')
 *    - ea       ('Completed Checkout Step') // set in formatEnhancedEcommerceEvent
 *    - ec       (.properties.category || 'EnhancedEcommerce') // set in formatEnhancedEcommerceEvent
 *    - el       (.properties.category || 'event') // set in formatEnhancedEcommerceEvent
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.checkoutStepCompleted = function(track, settings) {
  var renames = {
    option: 'col',
    step: 'cos'
  };

  return extend(
    formatEnhancedEcommerceEvent(track, 'checkout_option'),
    createCommonGAForm(track, settings),
    pick(values(renames), track.properties(renames))
  );
};

/**
 * Map Checkout Step Viewed (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required parameters:
 *    - cid      (set in createcommonGAForm)
 *    TODO: Is this option, or options?
 *    - col      (.properties.option) checkout step option
 *    - cos      (.properties.step) checkout step
 *    - dh       (.context.page.url -> hostname)
 *    - dp       (.context.page.path)
 *    - dt       (.context.page.title)
 *    - pa       ('checkout')
 *    - pr{x}br  (.properties.products[x].brand) product x brand
 *    - pr{x}ca  (.properties.products[x].category) product x category
 *    - pr{x}id  (.properties.products[x].id) product x id
 *    - pr{x}nm  (.properties.products[x].name) product x name (either this or id is required)
 *    - pr{x}pr  (.properties.products[x].price) product x price
 *    - pr{x}qt  (.properties.products[x].quantity) product x qty
 *    - pr{x}va  (.properties.products[x].variant) product x variant
 *    - ea       ('Completed Order') // set in formatEnhancedEcommerceEvent
 *    - ec       (.properties.category || 'EnhancedEcommerce') // set in formatEnhancedEcommerceEvent
 *    - el       (.properties.category || 'event') // set in formatEnhancedEcommerceEvent
 *    - t        ('event')
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.checkoutStepViewed = function(track, settings) {
  var renames = {
    step: 'cos',
    option: 'col'
  };

  return extend(
    formatEnhancedEcommerceEvent(track, 'checkout'),
    createCommonGAForm(track, settings),
    formatProducts(track.products()),
    formatPage(track),
    pick(values(renames), track.properties(renames))
  );
};

/**
 * Map Order Completed (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required parameters:
 *    - cid      (set in createcommonGAForm)
 *    - dh       (.context.page.url -> hostname)
 *    - dp       (.context.page.path)
 *    - dt       (.context.page.title)
 *    - pa       ('purchase')
 *    - ta       (.properties.affiliation)
 *    - ts       (.properties.shipping)
 *    - cu       (.properties.currency)
 *    - tr       (.properties.revenue)
 *    - ti       (.properties.orderId)
 *    - tt       (.properties.tax)
 *    - pr{x}br  (.properties.products[x].brand) product x brand
 *    - pr{x}ca  (.properties.products[x].category) product x category
 *    - pr{x}id  (.properties.products[x].id) product x id
 *    - pr{x}nm  (.properties.products[x].name) product x name (either this or id is required)
 *    - pr{x}pr  (.properties.products[x].price) product x price
 *    - pr{x}qt  (.properties.products[x].quantity) product x qty
 *    - pr{x}va  (.properties.products[x].variant) product x variant
 *    - t        ('event')
 *    - ea       ('Completed Order') // set in formatEnhancedEcommerceEvent
 *    - ec       (.properties.category || 'EnhancedEcommerce') // set in formatEnhancedEcommerceEvent
 *    - el       (.properties.category || 'event') // set in formatEnhancedEcommerceEvent
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.orderCompletedEnhanced = function(track, settings) {
  return compactObject(extend(
    {
      ta: track.proxy('properties.affiliation'),
      ts: track.shipping(),
      cu: track.currency(),
      tr: track.revenue(),
      ti: track.orderId(),
      tt: track.tax()
    },
    formatEnhancedEcommerceEvent(track, 'purchase'),
    createCommonGAForm(track, settings),
    formatPage(track),
    formatProducts(track.products())
  ));
};

/**
 * Map Order Refunded (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *
 * Required parameters:
 *    - cid      (set in createcommonGAForm)
 *    - ea       (.event)
 *    - ec       (.category)
 *    - ni       (1)
 *    - pa       ('refund')
 *    - t        ('event')
 *    - ti       (.properties.orderId)
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.orderRefunded = function(track, settings) {
  var renames = { orderId: 'ti' };

  return extend(
    formatEnhancedEcommerceEvent(track, 'refund'),
    createCommonGAForm(track, settings),
    formatProducts(track.products()),
    pick(values(renames), track.properties(renames)),
    { ni: 1 }
  );
};

/**
 * Map Promotion Viewed (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 *
 * Required parameters (https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters):
 *    - dh       (.context.page.url -> hostname)
 *    - dp       (.context.page.path)
 *    - dt       (.context.page.title)
 *    - promo1cr (.properties.creative)
 *    - promo1id (.properties.id)
 *    - promo1nm (.properties.name)
 *    - promo1ps (.properties.position)
 *    - t        (=event)
 *    - cid      (set in createcommonGAForm)
 *    - tid      (set in createcommonGAForm)
 *    - v        (set in createcommonGAForm)
 *
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.promotionViewed = function(track, settings) {
  var renames = {
    creative: 'promo1cr',
    id: 'promo1id', // adds spec v1 compatibility
    promotion_id: 'promo1id',
    promotionId: 'promo1id',
    name: 'promo1nm',
    position: 'promo1ps'
  };

  return compactObject(extend(
    formatEnhancedEcommerceEvent(track),
    formatPage(track),
    createCommonGAForm(track, settings),
    pick(values(renames), track.properties(renames)),
    { ni: 1 }
  ));
};

/**
 * Map Promotion Clicked (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 *
 * Required parameters (https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters):
 *    - ea       (.event)
 *    - ec       (.category)
 *    - el       (.properties.label)
 *    - promo1cr (.properties.creative)
 *    - promo1id (.properties.id)
 *    - promo1nm (.properties.name)
 *    - promo1ps (.properties.position)
 *    - promoa   ( =click)
 *    - t        ( =event)
 *    - cid      (set in createCommonGAForm)
 *    - tid      (set in createCommonGAForm)
 *    - v        (set in createCommonGAForm)
 *
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.promotionClicked = function(track, settings) {
  var renames = {
    creative: 'promo1cr',
    id: 'promo1id', // adds spec v1 compatibility
    promotionId: 'promo1id',
    promotion_id: 'promo1id',
    name: 'promo1nm',
    position: 'promo1ps'
  };

  return compactObject(extend(
    formatEnhancedEcommerceEvent(track),
    createCommonGAForm(track, settings),
    pick(values(renames), track.properties(renames)),
    {
      promoa: 'click',
      ni: 1
    }
  ));
};

/**
 * Map Product List Viewed (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 *
 * Required parameters (https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters):
 *    - ea       (.event)
 *    - ec       (.category)
 *    - t        ( =event)
 *    - pa       ( =detail)
 *    - dh       (.context.page.url -> hostname)
 *    - dp       (.context.page.path)
 *    - cid      (set in createCommonGAForm)
 *    - tid      (set in createCommonGAForm)
 *    - v        (set in createCommonGAForm)
 *    - il1pi{x}br  (.properties.products[x].brand) product x brand
 *    - il1pi{x}ca  (.properties.products[x].category) product x category
 *    - il1pi{x}id  (.properties.products[x].id) product x id
 *    - il1pi{x}nm  (.properties.products[x].name) product x name (either this or id is required)
 *    - il1pi{x}pr  (.properties.products[x].price) product x price
 *    - il1pi{x}qt  (.properties.products[x].quantity) product x qty
 *    - il1pi{x}va  (.properties.products[x].variant) product x variant
 *
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.productListViewed = function(track, settings) {
  var renames = {
    list_id: 'il1nm'
  };

  return extend(
    formatEnhancedEcommerceEvent(track, 'detail'),
    createCommonGAForm(track, settings),
    formatPage(track),
    formatProducts(track.properties().products, true),
    pick(values(renames), track.properties(renames))
  );
};

/**
 * Map Product List Filtered (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#enhancedecom
 *
 * Required parameters (https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters):
 *    - ea       (.event)
 *    - ec       (.category)
 *    - t        ( =event)
 *    - pa       ( =detail)
 *    - dh       (.context.page.url -> hostname)
 *    - dp       (.context.page.path)
 *    - cid      (set in createCommonGAForm)
 *    - tid      (set in createCommonGAForm)
 *    - v        (set in createCommonGAForm)
 *    - il1pi{x}br  (.properties.products[x].brand) product x brand
 *    - il1pi{x}ca  (.properties.products[x].category) product x category
 *    - il1pi{x}id  (.properties.products[x].id) product x id
 *    - il1pi{x}nm  (.properties.products[x].name) product x name (either this or id is required)
 *    - il1pi{x}pr  (.properties.products[x].price) product x price
 *    - il1pi{x}qt  (.properties.products[x].quantity) product x qty
 *    - il1pi{x}va  (.properties.products[x].variant) product x variant
 *
 * @api public
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 */

exports.productListFiltered = function(track, settings) {
  var renames = {
    list_id: 'il1nm'
  };

  var filterSortString = formatFilters(track.properties().filters, track.properties().sorts);

  //Currently, we're going to override the variant property with any filter/sort information.
  var modifiedProducts = track.properties().products;

  if (Array.isArray(modifiedProducts)){
    for (var i = 0; i < modifiedProducts.length; ++i) {
      modifiedProducts[i].variant = filterSortString;
    }
  }

  return extend(
    formatEnhancedEcommerceEvent(track, 'detail'),
    createCommonGAForm(track, settings),
    formatPage(track),
    formatProducts(modifiedProducts, true),
    pick(values(renames), track.properties(renames))
  );
};

/**
 * Create common GA form (Enhanced).
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#using-a-proxy-server
 *
 * @api private
 * @param {Object} track
 * @param {Object} settings
 * @return {Object}
 */

function createCommonGAForm(facade, settings, isMobileEvent) {
  var library = facade.proxy('context.library');
  var trackingId = isMobile(library) && settings.mobileTrackingId || settings.serversideTrackingId;
  var cid = hash(facade.userId() || facade.anonymousId());
  // isMobileEvent is specifically set on Install Attributed and Push Notification mobile campaign events to use properties.campaign instead of context.campaign.
  var campaign = isMobileEvent ? (facade.proxy('properties.campaign') || {}) : (facade.proxy('context.campaign') || {});
  var properties = facade.field('properties') || {};
  var screen = facade.proxy('context.screen') || {};
  var locale = facade.proxy('context.locale');
  var app = facade.proxy('context.app') || {};
  var traits = facade.traits();
  var options = facade.options('Google Analytics');
  var osName = facade.proxy('context.os.name');
  var osVersion = facade.proxy('context.os.version');
  var deviceModel = facade.proxy('context.device.model');
  var deviceManufacturer = facade.proxy('context.device.manufacturer');
  var timestamp = facade.timestamp();

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
  if (campaign.keyword) form.ck = campaign.keyword;
  if (campaign.content) form.cc = campaign.content;
  if (screen.name) form.cd = screen.name;    

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
  if (facade.ip()) form.uip = facade.ip();

  // queue time: time between when we recieved the event and when we forwarded it
  // max 3 hours 59 minutes to avoid discard
  if (timestamp) {
    var max = 14340000;
    var qt = (new Date()).getTime() - timestamp;
    if (qt > max) qt = max;
    if (qt < 0) qt = 0;
    form.qt = qt;
  }

  /**
   * GA parses userAgent to compute device type.
   * Generates a user agent if one is not provided for all calls only while context is present.
   *
   * Expected format:
   * Mozilla/[version] ([system and browser information]) [platform] ([platform details]) [extensions]

   * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#ua
   */

  if (facade.userAgent()) {
    form.ua = facade.userAgent();
  }
  else if(osName && osVersion && deviceModel && deviceManufacturer && locale) {
    form.ua = 'Mozilla/5.0 (' + deviceModel.slice(0, -3) + '; CPU ' + osName + ' ' + osVersion.replace(/\./g, '_') + ' like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/' + osVersion.charAt(0) + '.0 Mobile/10B329 Safari/8536.25';
  }
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

function createPageDataForm(facade, form) {
  var url = facade.proxy('properties.url') || facade.proxy('context.page.url');
  if (!is.string(url)) return form;

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

function metrics(obj, data) {
  var dimensions = data.dimensions || {};
  var metrics = data.metrics || {};
  var names = Object.keys(metrics).concat(Object.keys(dimensions));
  var ret = {};

  for (var i = 0; i < names.length; ++i) {
    var name = names[i];
    var key = shorten(metrics[name] || dimensions[name]);
    var value = lookup(obj, name) || obj[name];
    if (value == null) continue;
    if (is.boolean(value)) value = value.toString();
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

function shorten(name) {
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

function isMobile(library) {
  if (!library) return false;
  return contains('ios') || contains('android') || contains('analytics.xamarin');

  function contains(str) {
    return name().toLowerCase().indexOf(str) !== -1;
  }

  function name() {
    return typeof library === 'string' ? library : library.name;
  }
}

/**
 * Return a copy of an object, less an  `undefined` values.
 *
 * @param {Object} obj
 * @return {Object}
 */

function compactObject(obj) {
  return foldl(function(result, val, key) {
    if (val !== undefined) {
      result[key] = val;
    }
    return result;
  }, {}, obj);
}

/**
 * Format context.page into GA-compatible key-value pairs.
 *
 * @param {Track} track
 * @return {Object}
 */

function formatPage(track) {
  var parsedUrl = parse(track.proxy('context.page.url') || '');

  return compactObject({
    dh: parsedUrl.hostname || undefined,
    dp: parsedUrl.pathname || undefined,
    dt: track.proxy('context.page.title')
  });
}

/**
 * Format enhanced ecommerce track into GA-compatible key-value pairs.
 *
 * @param {Track} track
 * @param {String} action
 * @param {Boolean} typeOverride
 * @return {Object}
 */

function formatEnhancedEcommerceEvent(track, action, typeOverride) {
  return compactObject({
    pa: action,
    t: typeOverride || 'event',
    ea: track.event(),
    // properties.category in any ecommerce call is specced as a *product* category,
    // this is the proper classification for all ecommerce events' event category
    ec: 'EnhancedEcommerce',
    el: track.proxy('properties.label') || 'event'
  });
}

/**
 * Format mobile campaign track into GA-compatible key-value pairs.
 *
 * @param {Track} track
 * @param {String} action
 * @return {Object}
 */

function formatMobileCampaignEvent(track, action) {
  return compactObject({
    ea: track.event(),
    ec: 'All',
    el: track.proxy('properties.action') || 'event', // Speccing the action from Push Notification Bounced and Tapped here, if any.
    t: 'event'
  });
}

/**
 * Format a single product (from an ecommerce #track call) into a GA-compatible
 * set of key-value pairs.
 *
 * @api private
 * @param {Object} product
 * @param {number} [index=1]
 * @return {Object}
 * @example
 * formatProduct({ id: 9, name: 'Toothbrush' });
 * // => { pr1id: 9, pr1nm: 'Toothbrush' }
 */

function formatProduct(product, productIndex, includeList) {
  if (productIndex === undefined) productIndex = 1;
  var prefix;
  if (includeList){
    //This index of 1 is hard-coded since our spec can only support one list at a time.
    prefix = 'il1pi' + productIndex;
  } else {
    prefix = 'pr' + productIndex;
  }
  var renames = {
    brand: prefix + 'br',
    category: prefix + 'ca',
    sku: prefix + 'id',
    id: prefix + 'id', // adds spec v1 compatibility
    productId: prefix + 'id',
    product_id: prefix + 'id',
    name: prefix + 'nm',
    position: prefix + 'ps',
    price: prefix + 'pr',
    quantity: prefix + 'qt',
    variant: prefix + 'va'
  };
  var productFacade = new Track({ properties: product });
  return pick(values(renames), productFacade.properties(renames));
}

/**
 * Format a list of products (from an ecommerce #track call) into a
 * GA-compatible set of key-value pairs.
 *
 * @api private
 * @param {Object[]} products A list of products.
 * @return {Object}
 * @example
 * var products = [
 *   { id: 9, name: 'Toothbrush' },
 *   { id: 33, name: 'Toothpaste' },
 * ];
 * formatProducts(products);
 * // => { pr1id: 9, pr1nm: 'Toothbrush', pr2id: 33, pr2nm: 'Toothpaste' }
 */

function formatProducts(products, includeList) {
  return foldl(function(result, product, i) {
    // For those who refuse to follow spec, fail gracefully
    if (!is.object(product)) return result;
    return extend(result, formatProduct(product, i + 1, includeList));
  }, {}, products);
}

/**
 * Format any filters or sorters from a Product List Filtered call
 * into a readable string that could be easily parsed by the end customer.
 *
 * @api private
 * @param {Object [], Object []} filters, sorters - Two possible lists of
 *    filters or sorts used on the Product List Filtered
 * @return {String}
 * @example
 * var filters = [
 *   { type: 'department', value: 'gaming' },
 *   { type: 'price', value: 'over' }
 * ];
 * var sorters = [
 *   { type: 'price', value: 'desc' }
 * ];
 * // => "department:gaming,price:over::price:desc"
 */

function formatFilters(filters, sorts) {

  var resultStr = "";

  if (Array.isArray(filters)) {
    for (var i = 0; i < filters.length; ++i) {
      resultStr += filters[i].type + ":" + filters[i].value;
      if (i !== filters.length - 1) resultStr += ","
    }
  }

  resultStr += "::";

  if (Array.isArray(sorts)) {
    for (var i = 0; i < sorts.length; ++i) {
      resultStr += sorts[i].type + ":" + sorts[i].value;
      if (i !== sorts.length - 1) resultStr += ","
    }
  }

  return resultStr;
}
