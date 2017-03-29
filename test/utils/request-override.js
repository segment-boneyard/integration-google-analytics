'use strict';

/**
 * Google Analytics's validation endpoint returns responses with content-type
 * `application/javascript`, which superagent doesn't know how to parse.
 *
 * We can't muck with the request method much since integration-tester
 * overwrites it. We can however trick superagent into getting a mime type of
 * application/json every time it sees application/javascript. This is only for
 * testing, so its less of a scary hack than it could be.
 */

var utils = require('superagent/lib/node/utils');

var cachedType = utils.type;

utils.type = function(str) {
  if (str.indexOf('application/javascript') !== -1) {
    return 'application/json';
  }
  return cachedType(str);
};
