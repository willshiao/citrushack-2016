'use strict';

const passport = require('passport');

const User = require('../models/User');

passport.use('localStrategy', User.createStrategy());

passport.use('serializeUser', User.serializeUser());
passport.use('deserializeUser', User.deserializeUser());

module.exports = passport;
