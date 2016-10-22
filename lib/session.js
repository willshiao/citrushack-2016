'use strict';

const config = require('config');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

module.exports.sessionStore = new MongoStore(config.get('db'));

const sessionSettings = config.get('session');
sessionSettings.sessionStore = module.exports.sessionStore;

module.exports.session = session(sessionSettings);
