'use strict';

/**
 * Module dependencies.
 */

var mapper = require('./mapper');

/**
 * Product Viewed. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.productViewed = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.productViewed(track, this.settings))
    .end(done);
};

/**
 * Product Clicked. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.productClicked = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.productClicked(track, this.settings))
    .end(done);
};

/**
 * Product Added (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.productAdded = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.productAdded(track, this.settings))
    .end(done);
};

/**
 * Product Removed. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.productRemoved = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.productRemoved(track, this.settings))
    .end(done);
};

/**
 * Checkout Started (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.checkoutStarted = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.checkoutStarted(track, this.settings))
    .end(done);
};

/**
 * Order Updated. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.orderUpdated = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.orderUpdated(track, this.settings))
    .end(done);
};

/**
 * Checkout Step Viewed. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.checkoutStepViewed = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.checkoutStepViewed(track, this.settings))
    .end(done);
};

/**
 * Checkout Step Completed. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.checkoutStepCompleted = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.checkoutStepCompleted(track, this.settings))
    .end(done);
};

/**
 * Order Completed.
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

exports.orderCompleted = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.orderCompletedEnhanced(track, this.settings))
    .end(done);
};

/**
 * Order Refunded. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.orderRefunded = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.orderRefunded(track, this.settings))
    .end(done);
};

/**
 * Promotion Viewed. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.promotionViewed = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.promotionViewed(track, this.settings))
    .end(done);
};

/**
 * Promotion Clicked. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.promotionClicked = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.promotionClicked(track, this.settings))
    .end(done);
};

/**
 * Product List Viewed. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

exports.productListViewed = function(track, done) {
  this
    .post()
    .type('form')
    .send(mapper.productListViewed(track, this.settings))
    .end(done);
}

/**
 * Product List Filtered. (Enhanced ecommerce.)
 *
 * @param {Track} track
 * @param {Function} done
 */

 exports.productListFiltered = function(track, done ) {
  this
    .post()
    .type('form')
    .send(mapper.productListFiltered(track, this.settings))
    .end(done);
 }