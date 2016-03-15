'use strict';

/**
 * Module dependencies.
 */

var mapper = require('./mapper');

/**
 * Viewed Product. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.viewedProduct = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.viewedProduct(track, this.settings))
    .end(this.handle(done));
};

/**
 * Clicked Product. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.clickedProduct = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.clickedProduct(track, this.settings))
    .end(this.handle(done));
};

/**
 * Added Product. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.addedProduct = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.addedProduct(track, this.settings))
    .end(this.handle(done));
};

/**
 * Removed Product. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.removedProduct = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.removedProduct(track, this.settings))
    .end(this.handle(done));
};

/**
 * Started Order. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.startedOrder = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.startedOrder(track, this.settings))
    .end(this.handle(done));
};

/**
 * Updated Order. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.updatedOrder = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.updatedOrder(track, this.settings))
    .end(this.handle(done));
};

/**
 * Viewed Checkout Step. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.viewedCheckoutStep = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.viewedCheckoutStep(track, this.settings))
    .end(this.handle(done));
};

/**
 * Completed Checkout Step. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.completedCheckoutStep = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.completedCheckoutStep(track, this.settings))
    .end(this.handle(done));
};

/**
 * Completed Order.
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

exports.completedOrder = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.completedOrderEnhanced(track, this.settings))
    .end(this.handle(done));
};

/**
 * Refunded Order. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.refundedOrder = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.refundedOrder(track, this.settings))
    .end(this.handle(done));
};

/**
 * Viewed Promotion. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.viewedPromotion = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.viewedPromotion(track, this.settings))
    .end(this.handle(done));
};

/**
 * Clicked Promotion. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.clickedPromotion = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.clickedPromotion(track, this.settings))
    .end(this.handle(done));
};
