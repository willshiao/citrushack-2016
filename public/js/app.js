'use strict';

socket.on('connect', function() {
  console.log('Connected successfully!');
});

$(function() {
  $('#new-task-form').submit(function(evt) {
    evt.preventDefault();
  });

  $('#join-room-form').submit(function(evt) {
    evt.preventDefault();
  });

  $('#create-room-form').submit(function(evt) {
    evt.preventDefault();
    socket.emit('room:create', {
      roomName: $('#room-name-input').val(),
    });
  });
});

socket.on('room:create:res', function(data) {
  console.log('Got data:', data);
  if(!data.success) return console.error('Failed to create room');
  console.log('Successfully created room');
  roomId = data.roomId;
});
