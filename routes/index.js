'use strict';
const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('pages/index.hbs', { title: 'Express', siteName: 'Collaborooms'});
});

router.get('/login', (req, res) => {
  res.render('signin', { title: 'Login' });
});

router.get('/test', (req, res) => {
  res.render('test', { title: 'Test' });
});

module.exports = router;
