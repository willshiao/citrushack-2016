'use strict';

const config = require('config');
const io = require('socket.io')();
const passportSocketIo = require('passport.socketio');

const logger = require('./logger').loggers.get('socket');
const sessionStore = require('./session').sessionStore;
const passport = require('./passport');


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
  logger.debug('User: ', user);
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
