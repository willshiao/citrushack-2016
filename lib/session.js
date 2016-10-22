'use strict';

const config = require('config');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');

module.exports.sessionStore = new MongoStore({mongooseConnection: mongoose.connection});

const sessionSettings = config.get('session');
sessionSettings.store = module.exports.sessionStore;

module.exports.session = session(sessionSettings);
