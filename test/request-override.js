'use strict';

/**
 * Google Analytics's validation endpoint returns responses with content-type
 * `application/javascript`, which superagent doesn't know how to parse.
 *
 * The superagent instance isn't exposed on the integration so we can't easily
 * mixin a custom parser; hence why we provide an alternative request method.
 *
 * Since we only need to hit the validation endpoint in our tests I'm fine
 * with the kludge.
 */

var request = require('superagent');
request.parse['application/javascript'] = request.parse['application/json'];

/**
 * Direct copy of existing integration.request method, but with parser override
 * https://github.com/segmentio/integration/blob/master/lib/proto.js#L211
 */

module.exports = function(method, path) {
  method = method || 'get';
  var url = path || '';
  var self = this;

  if (!isAbsolute(url)) url = this.endpoint + url;
  this.debug('create request %s', method, url);

  var req = request[method](url);
  var end = req.end;

  req.set('User-Agent', 'Segment.io/1.0');
  req.end = function onend(fn) {
    fn = fn || function() {};
    self.emit('request', this);
    self.debug('request %s %j', req.url, req._data);
    return end.call(this, function(err, res) {
      if (err) return onerror(err, res, fn);
      if (res.error) return onerror(res.error, res, fn);
      return fn(null, res);
    });
  };

  function onerror(err, res, fn) {
    if (err.timeout) err.code = 'ECONNABORTED';
    return fn(err, res);
  }

  return req;
};

function isAbsolute(url) {
  return url.indexOf('https:') === 0
    || url.indexOf('http:') === 0;
}
