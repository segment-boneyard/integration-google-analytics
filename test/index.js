'use strict';

var Test = require('segmentio-integration-tester');
var GoogleAnalytics = require('..');

describe('Google Analytics', function() {
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
    test = new Test(ga, __dirname);
  });

  it('should have the correct settings', function() {
    test
      .name('Google Analytics')
      .channels(['server']);
  });

  describe('.validate()', function() {
    it('should be valid with .serversideTrackingId', function() {
      test.valid({}, settings);
    });

    it('should still be valid with just .mobileTrackingId', function() {
      delete settings.serversideTrackingId;
      test.valid({}, settings);
    });

    it('should still be valid with just .serversideTrackingId', function() {
      delete settings.mobileTrackingId;
      test.valid({}, settings);
    });

    it('should be invalid without .serversideTrackingId or .mobileTrackingId', function() {
      delete settings.serversideTrackingId;
      delete settings.mobileTrackingId;
      test.invalid({}, settings);
    });

    it('should be valid with context.app.name', function() {
      test.valid({
        type: 'screen',
        context: {
          app: {
            name: 'foo'
          }
        }
      }, settings);
    });

    it('should be invalid without context.app.name', function() {
      test.invalid({
        type: 'screen'
      }, settings);
    });
  });
});
