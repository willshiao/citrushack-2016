'use strict';

function json(data) {
  data.success = true;
  return data;
}

function successMsg(message) {
  return {
    success: true,
    message: message,
  }
}

function fail(message) {
  return {
    success: false,
    message: message,
  };
}

module.exports = {
  json,
  successMsg,
  fail
};
