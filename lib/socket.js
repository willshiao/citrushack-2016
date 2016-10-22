'use strict';

const config = require('config');
const Promise = require('bluebird');
const io = require('socket.io')();
const passportSocketIo = require('passport.socketio');

const logger = require('./logger').loggers.get('socket');
const sessionStore = require('./session').sessionStore;
const passport = require('./passport');
const h = require('./helpers');
const User = Promise.promisifyAll(require('../models/User'));


io.use(passportSocketIo.authorize({
  secret: config.get('session.secret'),
  store: sessionStore,
  passport: passport,
  success: onAuthorizeSuccess,
  fail: onAuthorizeFail,
}));

io.on('connection', (socket) => {
  logger.debug('Socket connected!');
  const user = socket.request.user || null;
  const loggedIn = socket.request.user.logged_in;
  // logger.debug('User: ', user);

  socket.on('user:register', data => {
    if(data.confirmPassword !== data.password) {
      return socket.emit('user:register:res', h.fail('Passwords don\'t match'))
    }
    User.registerAsync(data.username, data.password)
      .then(() => socket.emit('user:register:res', h.successMsg('Registered successfully')))
      .catch(err => socket.emit('user:register:res', h.fail(err.message)));
  });
});

function onAuthorizeSuccess(data, accept) {
  logger.debug('Successfully authenticated user.');
  accept();
}

function onAuthorizeFail(data, message, err, accept) {
  if(err) return logger.error("Failed to authorize: " + err);
  logger.debug('Failed connection to socket.io: ', message);
  // accept(new Error(message));
  accept();
}

module.exports = io;
