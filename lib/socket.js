'use strict';

const config = require('config');
const io = require('socket.io')();
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');

const logger = require('./logger').loggers.get('socket');
const sessionStore = require('./session').sessionStore;


io.use(passportSocketIo.authorize({
  cookieParser,
  sessionStore,
  success: onAuthorizeSuccess,
  fail: onAuthorizeFail,
}));

function onAuthorizeSuccess(data, accept) {
  logger.debug('Successfully authenticated user.');
  accept();
}

function onAuthorizeFail(data, message, err, accept) {
  if(err) return logger.error(err);
  logger.debug('Failed connection to socket.io: ', message);
  accept(new Error(message));
}

module.exports = io;
