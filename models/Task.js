'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const config = require('config');
const shortid = require('shortid');

const taskSchema = new Schema({
  name: String,
  slug: { type: String, default: shortid.generate },
  isChecklist: Boolean,
  listItems: [{
    text: String,
    completed: Boolean,
  }],
  description: String,
  deleted: {type: Boolean, default: false},
  roomSlug: String,
  assignedTo: String,
});

module.exports = mongoose.model('Task', taskSchema);
