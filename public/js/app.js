'use strict';

socket.on('connect', function() {
  console.log('Connected successfully!');
});

$(function() {
  $('#sortable').sortable();
  $('#sortable').disableSelection();

  socket.emit('task:get');

  $('#checklist-checkbox').change(function() {
    if(this.checked) {
      $('#description-container').hide();
    } else {
      $('#description-container').show();
    }
  });

  $('#new-task-form').submit(function(evt) {
    evt.preventDefault();
    socket.emit('task:new', {
      name: $('#task-name-input').val(),
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

socket.on('task:new:res', data => {
  if(!data.success) return console.error(data.message);
  console.log('Added new task successfully');
});

socket.on('task:get:res', function(tasks) {
  console.log('Got tasks:', tasks);
  clearTasks();
  var taskElements = tasks
    .map(task => makeTaskElement(task.name, task.content));
  for(var i = 0; i < taskElements.length; ++i) {
    $('#tasks').append(taskElements[i]);
  }
});

socket.on('update:task:new', function(task) {
  console.log('Got new task:', task);
  $('#tasks').append(makeTaskElement(task.name, task.content));
});

function clearTasks() {
  $('#tasks').html('');
}

function makeTaskElement(title, content) {
  return '<div class="card card-block tasks">\n' +
    '<h4 class="card-title task-title">' + escapeHtml(title) + '</h4>\n' +
    '<p class="task-content">' + escapeHtml(content || '') + '</p>\n' +
    '</div>';
}

var entityMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#39;',
  "/": '&#x2F;'
};

function escapeHtml(string) {
  return String(string).replace(/[&<>"'\/]/g, function (s) {
    return entityMap[s];
  });
}