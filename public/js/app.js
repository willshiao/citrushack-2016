'use strict';

socket.on('connect', function() {
  console.log('Connected successfully!');
});

$(function() {
  $('#new-task-form').submit(function(evt) {
    evt.preventDefault();
    socket.emit('task:new', {
      title: $('#task-name-input').val(),
    });
  });

  $('#join-room-form').submit(function(evt) {
    evt.preventDefault();
    socket.emit('room:join', {
      roomId: $('#room-id-input').val()
    });
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
  $('#room').text(data.name);
  $('#roomId').text('(' + data.roomId + ')');
});

socket.on('room:join:res', function(data) {
  console.log('Got response: ', data);
  if(!data.success) return console.error('Failed to join room');
  $('#room').text(data.name);
  $('#roomId').text('(' + data.roomId + ')');
});
