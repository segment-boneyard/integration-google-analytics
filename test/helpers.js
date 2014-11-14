
var facade = require('segmentio-facade');
var merge = require('merge-util');
var join = require('path').join;
var assert = require('assert');
var uid = require('uid');

/**
 * Create our testing variables
 */

var firstId  = uid();
var secondId = uid();
var groupId  = uid();
var email = 'testing-' + firstId + '@segment.io';

/**
 * Mapper tester.
 *
 * @param {String} dirname
 * @return {Function}
 */

exports.mapper = function(dirname){
  assert(dirname, '__dirname must be supplied');
  dirname = join(dirname, 'fixtures');
  return function(integration){
    integration.fixture = function(name, settings){
      var dir = join(dirname, name + '.json');
      var json = require(dir);
      var input = json.input;
      var output = json.output;
      var type = input.type[0].toUpperCase() + input.type.slice(1);
      var Type = facade[type];
      var map = integration.mapper[input.type];
      var mapped = map.call(integration, new Type(input), settings || {});
      mapped = JSON.parse(JSON.stringify(mapped)); // dates
      mapped.should.eql(output);
    };
  };
};

/**
 * Create ecommerce transaction.
 *
 * @param {Object} options
 * @return {Track}
 */

exports.transaction = function(options){
  return new facade.Track(merge({
    userId: firstId,
    channel: 'server',
    timestamp: new Date,
    event: 'Completed Order',
    properties: {
      orderId: 't-39a224df',
      total: 99.99,
      shipping: 13.99,
      tax: 20.99,
      products: [{
        quantity: 1,
        price: 24.75,
        name: 'Sony Pulse',
        sku: 'p-957c416f',
        category: 'Entertainment'
      }, {
        quantity: 3,
        price: 24.75,
        name: 'Sony PS3',
        sku: 'p-5bd14e17',
        category: 'Entertainment'
      }]
    },
    options: {
      ip: '4.184.68.0',
      userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)'
    }
  }, options));
};

/**
 * Create a track call merged from `options`
 *
 * @param {Object} options
 * @return {Track}
 */

exports.track = function (options) {
  options = options || {};
  return new facade.Track(merge({
    userId     : firstId,
    event      : 'Baked a cake',
    properties : {
      layers  : ['chocolate', 'strawberry', 'fudge'],
      revenue : 19.95,
      numLayers : 10,
      fat : 0.02,
      bacon : '1',
      date : (new Date()).toISOString(),
      address : {
        state : 'CA',
        zip  : 94107,
        city : 'San Francisco'
      }
    },
    channel    : 'server',
    timestamp  : new Date(),
    options : {
      traits : {
        email   : options.email || email,
        age     : 23,
        created : new Date(),
        bad     : null,
        alsoBad : undefined,
        address : {
          state : 'CA',
          zip  : 94107,
          city : 'San Francisco'
        }
      },
      ip : '4.184.68.0',
      userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)'
    }
  }, options));
};

/**
 * Create a bare track call merged from `options`
 *
 * @param {Object} options
 * @return {Track}
 */


exports.track.bare = function (options) {
  return new facade.Track(merge({
    userId  : 'aaa',
    event   : 'Bear tracks',
    channel : 'server'
  }, options || {}));
};

/**
 * Create an identify call merged from `options`
 *
 * @param {Object} options
 * @return {Identify}
 */

exports.identify = function (options) {
  options = options || {};
  return new facade.Identify(merge({
    userId : firstId,
    traits : {
      fat         : 0.02,
      firstName   : 'John',
      'Last Name' : 'Doe',
      email       : options.email || email,
      company     : 'Segment.io',
      city        : 'San Francisco',
      state       : 'CA',
      phone       : '5555555555',
      websites    : [
        'http://calv.info',
        'http://ianstormtaylor.com',
        'http://ivolo.me',
        'http://rein.pk'
      ],
      bad     : null,
      alsoBad : undefined,
      met : (new Date()).toISOString(),
      created : new Date('1/12/2013'),
      userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)'
    },
    context : {
      ip : '12.212.12.49'
    },
    timestamp : new Date(),
    channel : 'server'
  }, options));
};

/**
 * Create a page call merged from `options`
 *
 * @param {Object} options
 * @return {Page}
 */

exports.page = function(options){
  return new facade.Page(merge({
    userId: firstId,
    name: 'Docs',
    category: 'Support',
    properties: {
      url: 'https://segment.io/docs',
      title: 'Analytics.js - Segment.io'
    },
    context: {
      ip: '12.212.12.49'
    },
    timestamp: new Date,
    channel: 'server'
  }, options || {}));
};

/**
 * Create a screen call merged from `options`
 *
 * @param {Object} options
 * @return {Page}
 */

exports.screen = function(options){
  return new facade.Screen(merge({
    userId: firstId,
    name: 'Login',
    category: 'Authentication',
    properties: {
      type: 'Facebook'
    },
    context: {
      ip: '12.212.12.49'
    },
    timestamp: new Date,
    channel: 'server'
  }, options || {}));
};

/**
 * Create a group call merged from `options`
 *
 * @param {Object} options
 * @return {Group}
 */

exports.group = function(options){
  return new facade.Group(merge({
    groupId: groupId,
    userId: firstId,
    traits: {
      email: email,
      name: 'Segment.io',
      state: 'CA',
      city: 'San Francisco',
      created: new Date('2/1/2014'),
      plan: 'Enterprise',
    },
    context: {
      ip: '12.212.12.49'
    },
    timestamp: new Date,
    channel: 'server'
  }, options || {}));
};

/**
 * Create an alias call merged from `options`
 *
 * @param {Object} options
 * @return {Alias}
 */

exports.alias = function (options) {
  return new facade.Alias(merge({
    from      : firstId,
    to        : secondId,
    channel   : 'server',
    timestamp : new Date()
  }, options || {}));
};
