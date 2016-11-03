'use strict';

var Test = require('segmentio-integration-tester');
var helpers = require('./helpers');
var GoogleAnalytics = require('..');

describe('Google Analytics Classic', function() {
  var ga;
  var settings;
  var test;

  beforeEach(function() {
    settings = {
      serversideClassic: true,
      serversideTrackingId: 'UA-27033709-5'
    };
    ga = new GoogleAnalytics(settings);
    test = new Test(ga.classic);
  });

  it('should have the correct settings', function() {
    test
      .name('Google Analytics')
      .endpoint('https://ssl.google-analytics.com/__utm.gif');
  });

  describe('.track()', function() {
    it('should get a good response from the API', function(done) {
      var track = helpers.track();
      var query = ga.classic._querystring(track);

      query.utmhn = '';
      query.utme = ga.classic.formatEvent(track);
      query.utmt = 'event';
      query.utmni = 1;

      test
        .set(settings)
        .track(track)
        .query(query)
        .expects(200)
        .end(done);
    });

    it('should replace nonascii chars for userAgent', function(done) {
      var track = helpers.track({ content: {
        userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; 谷���新道 Trident/6.0)' 
      }});
      var query = ga.classic._querystring(track);

      query.utmhn = '';
      query.utme = ga.classic.formatEvent(track);
      query.utmt = 'event';
      query.utmni = 1;

      test
        .set(settings)
        .track(track)
        .query(query)
        .expects(200)
        .end(done);
    });
  });

  describe('.page()', function() {
    it('should get a good response from the API', function(done) {
      var page = helpers.page();
      var query = ga.classic._querystring(page);

      query.utmhn = '';
      query.utmdt = page.proxy('properties.title') || '';
      query.utmp = page.proxy('properties.path') || '/';

      test
        .set(settings)
        .page(page)
        .query(query)
        .expects(200)
        .end(done);
    });
  });
});
