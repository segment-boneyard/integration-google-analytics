'use strict';

/**
 * Module dependencies.
 */

var GoogleAnalytics = require('..');
var Test = require('segmentio-integration-tester');
var assert = require('assert');
var each = require('lodash.foreach');
var enhancedEcommerceMethods = require('../lib/universal/enhanced-ecommerce');
var fmt = require('util').format;
var mapper = require('../lib/universal/mapper');
var sinon = require('sinon');

require('./utils/request-override');

/**
 * Tests.
 */

describe('Google Analytics :: Universal', function() {
  var ga;
  var settings;
  var test;

  beforeEach(function() { 
    settings = {
      serversideTrackingId: 'UA-27033709-11',
      mobileTrackingId: 'UA-27033709-23',
      serversideClassic: false
    };
    ga = new GoogleAnalytics(settings);
    test = new Test(ga.universal, __dirname);
    test.mapper(mapper);
  });

  describe('mapper', function() {
    describe('page', function() {
      var options = { ignored: ['qt'] };

      it('should map basic page', function() {
        test.maps('page-basic', settings, options);
      });

      it('should map context.app', function() {
        test.maps('page-app', settings, options);
      });

      it('should map context.campaign', function() {
        test.maps('page-campaign', settings, options);
      });

      it('should map context.screen', function() {
        test.maps('page-screen', settings, options);
      });

      it('should map context.locale', function() {
        test.maps('page-locale', settings, options);
      });

      it('should map page with custom dimensions and metrics', function() {
        test.maps('page-cm-cd', settings, options);
      });
    });

    describe('track', function() {
      var options = { ignored: ['qt'] };

      it('should map basic track', function() {
        test.maps('track-basic', settings, options);
      });

      it('should map context.app', function() {
        test.maps('track-app', settings, options);
      });

      it('should map context.screen', function() {
        test.maps('page-screen', settings, options);
      });

      it('should map page with custom dimensions and metrics', function() {
        test.maps('track-cm-cd', settings, options);
      });

      it('should map url in track call', function() {
        test.maps('track-url', settings, options);
      });

      it('should fail gracefully by skipping the product in products array if it is a nonobject', function(){
        test.maps('started-checkout-uncaught', settings, options);
      });
    });

    describe('completed-order', function() {
      var options = { ignored: ['qt'] };

      it('should map basic completed-order', function() {
        test.maps('completed-order-basic', settings, options);
      });

      it('should map context.app', function() {
        test.maps('completed-order-app', settings, options);
      });

      it('should map context.screen', function() {
        test.maps('page-screen', settings, options);
      });

      it('should map page with custom dimensions and metrics', function() {
        test.maps('completed-order-cm-cd', settings, options);
      });
    });

    describe('screen', function() {
      var options = { ignored: ['qt'] };

      it('should map basic screen', function() {
        test.maps('screen-basic', settings, options);
      });

      it('should map context.app', function() {
        test.maps('screen-app', settings, options);
      });

      it('should fall back to server-side id', function() {
        delete settings.mobileTrackingId;
        test.maps('screen-server-id', settings, options);
      });
    });
  });

  describe('.track()', function() {
    it('should get a good response from the API', function(done) {
      var track = {};
      track.userId = 'userId';
      track.event = 'event';
      test
        .set(settings)
        .track(track)
        .expects(200, done);
    });

    it('should respect .label, .category and .value', function(done) {
      var json = test.fixture('track-basic');
      test
        .set(settings)
        .track(json.input)
        .sendsAlmost(json.output, { ignored: ['qt'] })
        .expects(200, done);
    });

    it('should set qt to be accurate queue time', function(done) {
      var callSentTime = new Date();
      var clock = sinon.useFakeTimers(callSentTime.getTime());
      var json = test.fixture('track-basic');

      json.input.timestamp = callSentTime.toISOString();
      clock.tick(1000);
      json.output.qt = new Date() - callSentTime;

      test
        .set(settings)
        .track(json.input)
        .sendsAlmost(json.output)
        .expects(200, done);
    });

    it('should set a max limit of 14340000ms max for queue time', function(done) {
      var callSentTime = new Date();
      var clock = sinon.useFakeTimers(callSentTime.getTime());
      var json = test.fixture('track-basic');

      json.input.timestamp = callSentTime.toISOString();
      clock.tick(14340001);
      json.output.qt = 14340000;

      test
        .set(settings)
        .track(json.input)
        .sendsAlmost(json.output)
        .expects(200, done);
    });

    it('should pass screenName to GA from context.screen.name', function(done) {
      var json = test.fixture('track-screen-name');
      test
        .set(settings)
        .track(json.input)
        .sendsAlmost(json.output, { ignored: ['qt'] })
        .expects(200, done);
    });

    it('should fallback to .revenue after .value', function(done) {
      var json = test.fixture('track-revenue');
      test
        .set(settings)
        .track(json.input)
        .sendsAlmost(json.output, { ignored: ['qt'] })
        .expects(200, done);
    });

    it('should send custom dimensions and metrics', function(done) {
      var json = test.fixture('track-cm-cd');
      test
        .set(settings)
        .set(json.settings)
        .track(json.input)
        .sendsAlmost(json.output, { ignored: ['qt'] })
        .expects(200, done);
    });

    it('should not send ua if device is not present', function(done) {
      var json = test.fixture('track-app');
      test
        .set(settings)
        .set(json.settings)
        .track(json.input)
        .sendsAlmost(json.output, { ignored: ['qt'] })
        .expects(200, done);
    });
  });

  describe('.page()', function() {
    it('should get a good response from the API', function(done) {
      var json = test.fixture('page-basic');
      test
        .set(settings)
        .page(json.input)
        .sendsAlmost(json.output, { ignored: ['qt'] })
        .expects(200, done);
    });

    it('should send custom dimensions and metrics', function(done) {
      var json = test.fixture('page-cm-cd');
      test
        .set(settings)
        .set(json.settings)
        .page(json.input)
        .sendsAlmost(json.output, { ignored: ['qt'] })
        .expects(200, done);
    });

    it('should create ua without userAgent present', function(done) {
      var json = test.fixture('page-app');
      test
        .set(settings)
        .set(json.settings)
        .page(json.input)
        .sendsAlmost(json.output, { ignored: ['qt'] })
        .expects(200, done);
    });
  });

  describe('.screen()', function() {
    it('should get a good response from the API', function(done) {
      var json = test.fixture('screen-basic');
      test
        .set(settings)
        .screen(json.input)
        .sendsAlmost(json.output, { ignored: ['qt'] })
        .expects(200, done);
    });

    it('should send app info', function(done) {
      var json = test.fixture('screen-app');
      test
        .set(settings)
        .set(json.settings)
        .screen(json.input)
        .sendsAlmost(json.output, { ignored: ['qt'] })
        .expects(200, done);
    });

    it('should send ua value', function(done) {
      var json = test.fixture('screen-app');
      test
        .set(settings)
        .set(json.settings)
        .screen(json.input)
        .sendsAlmost(json.output, { ignored: ['qt'] })
        .expects(200, done);
    });
  });

  describe('.completedOrder()', function() {
    it('should send a regular completed order event', function(done) {
      var json = test.fixture('completed-order-basic');
      test
        .set(settings)
        .set({ enhancedEcommerce: false })
        .track(json.input)
        .request(0)
        .sendsAlmost(json.output[0], { ignored: ['qt'] })
        .expects(200, done);
    });

    it('should send transaction data', function(done) {
      var json = test.fixture('completed-order-basic');
      test
        .set(settings)
        .set({ enhancedEcommerce: false })
        .track(json.input)
        .request(1)
        .sendsAlmost(json.output[1], { ignored: ['qt'] })
        .expects(200, done);
    });

    it('should send item data', function(done) {
      var json = test.fixture('completed-order-basic');
      test
        .set(settings)
        .set({ enhancedEcommerce: false })
        .track(json.input)
        .request(2)
        .sendsAlmost(json.output[2], { ignored: ['qt'] })
        .expects(200, done);
    });
  });

  describe('Mobile Campaign Events', function() {

    describe('.installAttributed()', function() {
      it('should send a regular install attributed event with properties.campaign', function(done) {
        var json = test.fixture('install-attributed-basic');
        test
          .set(settings)
          .set({ enhancedEcommerce: false })
          .track(json.input)
          .request(0)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });
    });

    describe('.pushNotificationReceived()', function() {
      it('should send a regular push notification received event with properties.campaign', function(done) {
        var json = test.fixture('push-notification-received-basic');
        test
          .set(settings)
          .set({ enhancedEcommerce: false })
          .track(json.input)
          .request(0)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });      
    });

    describe('.pushNotificationTapped()', function() {
      it('should send a regular install attributed event with properties.campaign', function(done) {
        var json = test.fixture('push-notification-tapped-basic');
        test
          .set(settings)
          .set({ enhancedEcommerce: false })
          .track(json.input)
          .request(0)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });
    });

    describe('.pushNotificationBounced()', function() {
      it('should send a regular install attributed event with properties.campaign', function(done) {
        var json = test.fixture('push-notification-bounced-basic');
        test
          .set(settings)
          .set({ enhancedEcommerce: false })
          .track(json.input)
          .request(0)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });
    });
  });

  describe('enhanced ecommerce', function() {
    beforeEach(function() {
      settings.enhancedEcommerce = true;
      ga = new GoogleAnalytics(settings);
      test = new Test(ga.universal, __dirname);
      test.mapper(mapper);
    });

    it('should not have EE methods when EE is not enabled', function() {
      settings.enhancedEcommerce = false;
      ga = new GoogleAnalytics(settings);
      test = new Test(ga.universal, __dirname);

      each(enhancedEcommerceMethods, function(method, name) {
        assert(
          ga.universal[name] !== method,
          /*eslint-disable*/
          fmt('GA should not have enhanced ecommerce method %s when settings.enhancedEcommerce is `false`', name)
          /*eslint-enable*/
        );
      });
    });

    it('should have EE methods when EE is enabled', function() {
      each(enhancedEcommerceMethods, function(method, name) {
        assert(
          ga.universal[name] === method,
          /*eslint-disable*/
          fmt('GA should have enhanced ecommerce method %s when settings.enhancedEcommerce is `true`', name)
          /*eslint-enable*/
        );
      });
    });

    describe('#viewedProduct', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('viewed-product-basic');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('viewed-product-basic');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#clickedProduct', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('clicked-product-basic');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('clicked-product-basic');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#addedProduct', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('added-product-basic');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('added-product-basic');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#removedProduct', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('removed-product-basic');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('removed-product-basic');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#startedCheckout', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('started-checkout-basic');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('started-checkout-basic');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#updatedOrder', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('updated-order-basic');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('updated-order-basic');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#completedCheckoutStep', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('completed-checkout-step-basic');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('completed-checkout-step-basic');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#viewedCheckoutStep', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('viewed-checkout-step-basic');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('viewed-checkout-step-basic');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#refundedOrder', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('refunded-order-basic');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('refunded-order-basic');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#refundedOrderPartial', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('refunded-order-partial');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('refunded-order-partial');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#clickedPromotion', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('clicked-promotion-basic');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('clicked-promotion-basic');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#completedOrder', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('completed-order-enhanced');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('completed-order-enhanced');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#viewedPromotion', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('viewed-promotion-basic');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('viewed-promotion-basic');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#productListViewed', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('viewed-product-list');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('viewed-product-list');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });

    describe('#filteredProductList', function() {
      it('should send the right data', function(done) {
        var json = test.fixture('filtered-product-list');
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(200, done);
      });

      it('should be a valid hit', function(done) {
        var json = test.fixture('filtered-product-list');
        test.integration.endpoint = 'https://ssl.google-analytics.com/debug/collect';
        test
          .set(settings)
          .track(json.input)
          .sendsAlmost(json.output, { ignored: ['qt'] })
          .expects(/"valid": true/, done);
      });
    });
  });
});
