'use strict';

/**
 * Module dependencies.
 */

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
  .retries(2);

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
    .end(callback);
};

/**
 * Page.
 *
 * @param {Track} page
 * @param {Function} callback
 */

GA.prototype.page = function(page, callback) {
  var payload = mapper.page(page, this.settings);
  return this
    .post()
      .type('form')
      .send(payload)
      .end(callback);
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
      .end(callback);
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

GA.prototype.orderCompleted = function(track, callback) {
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
        .end(done);
    });
  });

  batch.end(callback);
};

/**
 * Install Attributed (Mobile)
 *
 * @param {Track} track
 * @param {Function} callback
 */

GA.prototype.installAttributed = function(track, callback) {
  var payload = mapper.installAttributed(track, this.settings);
  return this
    .post()
      .type('form')
      .send(payload)
      .end(callback);
};

/**
 * Push Notification Received (Mobile)
 *
 * @param {Track} track
 * @param {Function} callback
 */

GA.prototype.pushNotificationReceived = function(track, callback) {
  var payload = mapper.pushNotificationReceived(track, this.settings);
  return this
    .post()
      .type('form')
      .send(payload)
      .end(callback);
};

/**
 * Push Notification Tapped (Mobile)
 *
 * @param {Track} track
 * @param {Function} callback
 */

GA.prototype.pushNotificationTapped = function(track, callback) {
  var payload = mapper.pushNotificationTapped(track, this.settings);
  return this
    .post()
      .type('form')
      .send(payload)
      .end(callback);
};

/**
 * Push Notification Bounced (Mobile)
 *
 * @param {Track} track
 * @param {Function} callback
 */

GA.prototype.pushNotificationBounced = function(track, callback) {
  var payload = mapper.pushNotificationBounced(track, this.settings);
  return this
    .post()
      .type('form')
      .send(payload)
      .end(callback);
};
