'use strict';
const config = require('config');
const express = require('express');
const router = express.Router();

const logger = require('../lib/logger');
const User = require('../models/User');
const Room = require('../models/Room');
const passport = require('../lib/passport');
const h = require('../lib/helpers');
const isAuthenticated = require('../lib/middleware').isAuthenticated;
const notAuthenticated = require('../lib/middleware').notAuthenticated;

/* GET home page. */
router.get('/', notAuthenticated, (req, res) => {
  console.log('User', req.user);
  res.render('pages/index', {
    title: 'Express',
    siteName: config.get('siteName'),
    scriptFile: 'index.js',
    noSocket: true,
  });
});

router.get('/logout', isAuthenticated, function(req, res){
  req.logout();
  res.redirect('/');
});

router.get('/welcome', (req, res) => {
  res.render('pages/welcome', { title: 'Welcome' });
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  // res.redirect('/app');
  res.json({success: true, redirect: '/app'});
});

router.post('/register', (req, res, next) => {
  logger.debug('Registering user...');
  if(!req.body.username || !req.body.password || !req.body.confirmPassword) {
    return res.json(h.fail('Missing one or more form fields'));
  } else if(req.body.password !== req.body.confirmPassword) {
    return res.json(h.fail('Passwords don\'t match'));
  }
  User.register(new User({username: req.body.username}), req.body.password, err => {
    if(err) {
      if(err.name === 'UserExistsError') {
        return res.json(h.fail('Username is taken'));
      }
      logger.error('Error registering user: ', err);
      return next(err);
    }
    logger.debug('User registered');
    // res.redirect('/app');
    res.json({success: true, redirect: '/app'});
  });
});

router.get('/app', isAuthenticated, (req, res) => {
  const settings = {
    title: config.get('siteName'),
    scriptFile: 'app.js',
  };

  if(!req.user.room) {
    return res.render('pages/interface', settings);
  }

  Room.find({slug: req.user.room})
    .limit(1)
    .lean()
    .exec()
    .then(room => {
      if(room.length <= 0) return res.render('pages/interface', settings);
      settings.roomId = room[0].slug;
      settings.roomName = room[0].name ? room[0].name : 'None';
      res.render('pages/interface', settings);
    })
    .catch(logger.error);
});

module.exports = router;
