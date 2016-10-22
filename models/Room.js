'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const config = require('config');
const shortid = require('shortid');

const roomSchema = new Schema({
  name: String,
  slug: { type: String, default: shortid.generate },
});

module.exports = mongoose.model('Room', roomSchema);
