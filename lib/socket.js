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
        socket.emit('room:user:update', [{
          name: user.username,
          slug: user.slug,
        }]);
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
        if(rooms.length < 1)
          return socket.emit('room:join:res', h.fail('Room not found.'));
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
        return User.findAllInRoom(user.room);
      }).then(users => {
        socket.emit('room:users:update', users);
      });
  });

  socket.on('room:users:get', () => {
    if(!user.room) return socket.emit('room:users:update', []);
    User.findAllInRoom(user.room)
      .then(users => {
        return socket.emit('room:users:update', users);
      });
  });

  socket.on('task:new', data => {
    if(!data.name)
      return socket.emit('task:new:res', h.fail('Missing name field'));
    let task;

    Room.find({slug: user.room})
      .limit(1)
      .exec()
      .then(room => {
        task = {
          name: data.name,
          content: data.content,
          isChecklist: data.isChecklist,
          listItems: data.listItems,
          roomSlug: user.room,
        };
        room[0].tasks.unshift(task);
        return room[0].save();
      })
      .then(room => {
        task.slug = room.tasks[0].slug;
        socket.emit('task:new:res', h.successMsg('Successfully added'));
        io.to(user.room).emit('update:task:new', task);
      });
  });

  socket.on('task:remove', (targetId) => {
    Room.find({ slug: user.room })
      .limit(1)
      .exec()
      .then(rooms => {
        rooms[0].tasks = rooms[0].tasks
          .filter(task => task.slug !== targetId);
        return rooms[0].save();
      }).then(() => {
        io.to(user.room).emit('task:removed', h.json({slug: targetId}));
      });
  });

  socket.on('task:get', () => {
    let room;
    Room.find({ slug: user.room })
      .limit(1)
      .lean()
      .exec()
      .then(rooms => {
        if(!rooms || rooms.length < 1) return socket.emit('task:get:res', []);
        room = rooms[0];
        return User.findAllInRoom(user.room);
      }).then(users => {
        const tasks = room.tasks.filter(task => task !== null).map(task => {
          if(!task || !task.assignedTo) return task;
          task.assignedName = users.find(usr => usr.slug === task.assignedTo).username;
          return task;
        });
        socket.emit('task:get:res', tasks);
      });
  });

  socket.on('task:reorder', newOrder => {
    let order;
    Room.find({ slug: user.room })
      .limit(1)
      .exec()
      .then(rooms => {
        const room = rooms[0];
        order = newOrder
          .map(slug => room.tasks
            .find(task => task.slug === slug));
        room.tasks = order;
        return room.save();
      }).then(rm => { 
        io.to(user.room).emit('task:get:res', order);
      })
      .catch(logger.error);
  });

  socket.on('task:delegate:assign', (taskSlug, delegateSlug) => {
    console.log('New delegate slug:', delegateSlug);
    Room.find({ slug: user.room })
      .limit(1)
      .exec()
      .then(rooms => {
        const room = rooms[0];
        const index = room.tasks.findIndex(task => task.slug === taskSlug);
        logger.debug('Got index of ', index);
        if(index < 0) return logger.error('Failed to find match for slug');
        room.tasks[index].assignedTo = delegateSlug;
        return room.save();
      }).then(room => {
        io.to(user.room).emit('task:delegate:update', taskSlug, delegateSlug);
      });
  });

  socket.on('chat:message', (msg) => {
    if(msg.length <= 0 || msg.length > 1000)
      return socket.send('chat:message:res', h.fail('Chat message too short or too long'));
    logger.debug('Got chat message:', msg, ' from ', user.username);
    io.to(user.room).emit('chat:message', user.username, msg);
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
