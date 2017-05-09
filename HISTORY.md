1.10.0 / 2017-05-09
===================

  * Add explicit support for mobile event campaign objects

1.9.9 / 2017-04-27
==================

  * Change addImpression-bound methods to use 'event' as their type

1.9.8 / 2017-04-17
==================

  * Push release

1.9.6 / 2017-03-29
==================

  * Update integration-worker version

1.9.6 / 2017-03-28
==================

  * Update integration-worker version

1.9.5 / 2017-03-09
==================

  * Changed sorters -> sorts to match spec
  * Protected expected array inputs

1.9.4 / 2017-03-07
==================

  * Corrected to integration-worker errors.

1.9.3 / 2017-03-07
==================

  * Add support for addImpression action

1.8.3 / 2017-02-10
==================

  * Update integration-worker version

1.8.2 / 2017-02-10
==================

  * Trigger build to ensure a version of the integration-worker with https://github.com/segmentio/integration-worker/pull/93 is used

1.8.1 / 2017-02-06
==================

  * Handle gracefully when sending malformed products array

1.8.0 / 2017-01-31
==================

  * Standardize integration (linting, Docker configuration, circle.yml, upgrade
segmentio-integration version, upgrade integration-worker version, etc.)


1.7.3 / 2016-11-03
==================

  * Replace nonascii characters with '?' in userAgent headers to prevent uncaughts

1.7.2 / 2016-10-06
==================

  * Fix a bug where iOS events weren't populating reports based on userAgent

1.7.1 / 2016-09-29
==================

  * Update segmentio-integration to v5 (#55)
  * Fix test assertions on new integration-tester version (#53)
  * CircleCI: Run deployment only when tags are pushed
  * CircleCI: Update circle.yml to install npm@2, ditch unnecessary deps (#56)

1.7.0 / 2016-09-06
==================

  * support ecom spec v2

1.6.1 / 2016-08-31
==================

  * deprecate order started, use checkout started

1.6.0 / 2016-08-24
==================

  * Merge pull request #50 from segment-integrations/partialRefunds
  * added partial refund functionality

1.5.1 / 2016-08-24
==================

  * changed tests and mapper to comply with spec v2 id's (#49)

1.5.0 / 2016-08-08
==================

  * Fix regular ecommerce Completed Order/Order Completed event

1.4.9 / 2016-08-05
==================

  * Update Integration-Tester version
  * Add support for Ecommerce spec v2

1.4.8 / 2016-07-28
==================

  * Merge pull request #44 from segment-integrations/addScreenName
  * merged
  * screenName is drawn from context.screen.name
  * Removed duplicate obj-case dependency
  * added screenName option to track events

1.4.7 / 2016-07-23
==================

  * Merge pull request #45 from segment-integrations/queuetime
  * force queuetime to be nonnegative

1.4.5 / 2016-07-05
==================

  * fixed bug causing qt to always be maximum value (#41)

1.4.4 / 2016-06-24
==================

  * set max queue time to 4hrs

1.4.3 / 2016-04-29
==================

  * Submit time spent in queue

1.4.2 / 2016-04-28
==================



1.2.1 / 2016-04-01
==================

  * Generates user agent

1.2.0 / 2016-03-18
==================

  * Add support for enhanced ecommerce
  * add docker, refactor circle
  * adds validation for context.app.name
  * reject -> invalid for settings error; rephrase

1.1.2 / 2015-09-11
==================

  * fix booleans from breaking metrics

1.1.1 / 2015-07-28
==================

  * Ensure string value prior to parsing url

1.1.0 / 2015-07-27
==================

  * Merge pull request #23 from segmentio/track/url
  * Support for url parameters.

1.0.12 / 2015-06-04
===================

  * Prevent proxying of undefined functions
  * Map locale to user language
  * Separate classic/universal tests
  * Refactor names for clarity, fix docstrings
  * Use strict mode everywhere
  * Clean up syntax inconsistencies, unused deps and dead code

1.0.11 / 2015-04-16
===================

  * Merge pull request #13 from segmentio/add/referrer
  * add support for document referrer

1.0.10 / 2015-04-09
===================

  * Merge pull request #12 from segmentio/fix/mobile
  * mobile: fall back to server-side tracking ID for compat

1.0.9 / 2015-04-04
==================

  * Merge pull request #11 from segmentio/add/mobile
  * add support for mobile properties and screen calls

1.0.8 / 2015-03-24
==================

  * Add properties to custom dimensions
  * Merge pull request #8 from segmentio/fix-tests
  * Fix tests
  * Update circle template

1.0.7 / 2015-01-21
==================

  * remove errant campaign parens

1.0.6 / 2014-12-08
==================

 * bump segmentio-integration

1.0.5 / 2014-12-03
==================

  * Only invoke proxied method if it exists

1.0.4 / 2014-12-02
==================

 * bump integration proto

1.0.3 / 2014-12-02
==================

 * remove .retries()
 * fix dev deps
 * bump dev deps

1.0.2 / 2014-12-02
==================

 * bump segmentio-integration

1.0.1 / 2014-11-21
==================

 * Bumping segmentio-integration
 * fix build status badge

1.0.0 / 2014-11-14
==================

  * Initial release
