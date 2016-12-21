'use strict';

/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var Batch = require('batch');
var enhancedEcommerceMethods = require('./enhanced-ecommerce');
var extend = require('@ndhoule/extend');
var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `GA`
 */

var GA = module.exports = integration('Google Analytics')
  .endpoint('https://ssl.google-analytics.com/collect')
  .channels(['server'])
  .retries(2);

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
  // If the user has enabled enhanced ecommerce, extend this instance with
  // handler methods for EE
  if (this.settings.enhancedEcommerce) {
    extend(this, enhancedEcommerceMethods);
  }
};

/**
 * Track.
 *
 * @param {Track} track
 * @param {Function} callback
 */

GA.prototype.track = function(track, callback) {
  var payload = mapper.track(track, this.settings);
  return this
    .post()
    .type('form')
    .send(payload)
    .end(this.handle(callback));
};

/**
 * Completed Order (Standard).
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
 * @param {Function} callback
 */

GA.prototype.orderCompleted = function(track, fn) {
  var payloads = mapper.orderCompleted(track, this.settings);
  var batch = new Batch();
  var self = this;

  // make sure batch throws.
  batch.throws(true);

  payloads.forEach(function(payload) {
    batch.push(function(done) {
      self
        .post()
        .type('form')
        .send(payload)
        .end(self.handle(done));
    });
  });

  batch.end(fn);
};

/**
 * Page.
 *
 * https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide#page
 *
 * @param {Page} page
 * @param {Function} fn
 */

GA.prototype.page = function(page, fn) {
  var payload = mapper.page(page, this.settings);
  return this
    .post()
      .type('form')
      .send(payload)
      .end(this.handle(fn));
};

/**
 * Screen.
 *
 * @param {Screen} screen
 * @param {Function} callback
 */

GA.prototype.screen = function(screen, callback) {
  var payload = mapper.screen(screen, this.settings);
  return this
    .post()
      .type('form')
      .send(payload)
      .end(this.handle(callback));
};

