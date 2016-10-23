'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const config = require('config');
const passportLocalMongoose = require('passport-local-mongoose');
const shortid = require('shortid');

const userSchema = new Schema({
  username: String,
  password: String,
  room: String,
  slug: { type: String, default: shortid.generate },
});

userSchema.statics.findAllInRoom = function(roomSlug) {
  return this.find({ room: roomSlug })
    .select({ slug: 1, username: 1, _id: -1 })
    .lean()
    .exec();
}

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
