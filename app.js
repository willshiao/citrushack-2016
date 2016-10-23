'use strict';

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require('config');
const hbs = require('hbs');
const Promise = require('bluebird');
const mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect(config.get('db').url);

const passport = require('./lib/passport');
const configuredSession = require('./lib/session').session;

const routes = require('./routes/index');

const app = express();
app.io = require('./lib/socket');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

hbs.registerPartials(`${__dirname}/views/partials`);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(configuredSession);

app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.siteUrl = config.get('siteUrl');
  res.locals.siteName = config.get('siteName');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
