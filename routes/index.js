'use strict';
const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('pages/interface.hbs', { title: 'Collaborooms', siteName: 'Collaborooms' });
});

router.get('/login', (req, res) => {
  res.render('signin', { title: 'Login' });
});

router.get('/test', (req, res) => {
  res.render('test', { title: 'Test' });
});

module.exports = router;
