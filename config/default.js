'use strict';

const config = {
  siteName: 'Collaborooms',
  session: {
    secret: 'JHvK2kgv0BWTdYWl7DN1',
    saveUninitialized: false,
    resave: false,
  },
  db: {
    url: 'mongodb://localhost:27017/citrus-hack',
  }
};

module.exports = config;
