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
const Room = require('../models/Room');


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

  if(user.room) {
    socket.join(user.room);
  }
  // logger.debug('User: ', user);

  socket.on('user:register', data => {
    if(data.confirmPassword !== data.password) {
      return socket.emit('user:register:res', h.fail('Passwords don\'t match'))
    }
    User.registerAsync(data.username, data.password)
      .then(() => socket.emit('user:register:res', h.successMsg('Registered successfully')))
      .catch(err => socket.emit('user:register:res', h.fail(err.message)));
  });

  socket.on('room:create', data => {
    if(!data.roomName) return socket.emit('room:create:res', h.fail('No room name specified'));
    let slug;

    new Room({
      name: data.roomName
    }).save()
      .then(room => {
        slug = room.slug;
        if(user.room) socket.leave(user.room);
        user.room = slug;
        return Promise.fromCallback(cb => user.save(cb));
      }).then(() => {
        socket.join(user.room);
        socket.emit('room:create:res', h.json({
          name: data.roomName,
          roomId: slug,
        }));
      })
      .catch(logger.error);
  });

  socket.on('room:join', data => {
    if(!data.roomId) return socket.emit('room:join:res', h.fail('No room name specified'));
    
    Room.find({ slug: data.roomId })
      .limit(1)
      .lean()
      .exec()
      .bind({})
      .then(rooms => {
        logger.debug('Joining room:', rooms);
        if(rooms.length < 1) return socket.emit('room:join:res', h.fail('Room not found.'));
        this.room = rooms[0];

        if(user.room) socket.leave(user.room);
        user.room = data.roomId;
        return Promise.fromCallback(cb => user.save(cb));
      }).then(() => {
        socket.join(user.room);
        socket.emit('room:join:res', h.json({
          name: this.room.name,
          roomId: data.roomId,
        }));
      });
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
