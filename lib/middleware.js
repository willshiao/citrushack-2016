'use strict';

const middleware = {};

middleware.isAuthenticated = function(req, res, next) {
  if(req.user)
    return next();
  res.redirect('/');
};

middleware.notAuthenticated = function(req, res, next) {
  if(req.user)
    return res.redirect('/app');
  next();
}

module.exports = middleware;
