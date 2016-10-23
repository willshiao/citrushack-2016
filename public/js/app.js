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
    var formInfo = {
      name: $('#task-name-input').val(),
    };
    // content: $('#task-description').val(),
    formInfo.isChecklist = $('#checklist-checkbox').is(':checked');
    if(formInfo.isChecklist) {
      formInfo.listItems = [];
    } else {
      formInfo.content = $('#task-description').val();
    }
    console.log('Submitting info: ', formInfo);
    socket.emit('task:new', formInfo);
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

  for(var i = 0; i < tasks.length; ++i) {
    $('#tasks').append(tasks[i].isChecklist ?
      makeChecklistElement(tasks[i]) :
      makeTaskElement(tasks[i]));
  }
});

socket.on('update:task:new', function(task) {
  console.log('Got new task:', task);
  $('#tasks').append(task.isChecklist ?
      makeChecklistElement(task) :
      makeTaskElement(task));
});

function clearTasks() {
  $('#tasks').html('');
}

function makeTaskElement(task) {
  return '<div class="card card-block tasks">\n' +
    '<h4 class="card-title task-title">' + escapeHtml(task.name) + '</h4>\n' +
    '<p class="task-content">' + escapeHtml(task.content || '') + '</p>\n' +
    '</div>';
}

function makeChecklistElement(task) {
  var el = '<div class="card card-block tasks">\n' +
      '<h4 class="card-title">' + escapeHtml(task.name) + '</h4>\n' +
      '<ul class="list-group" id="sortable" >';
  for(var i = 0; i < task.listItems; ++i) {
    el += makeListItem(task.listItems[i]);
  }
  el += '</ul>\n' +
    '</div>';
  return el;
}

function makeListItem(item) {
  return '<li class="list-group-item">\n' +
    '<p class="list-group-item-text">' + escapeHtml(item.text) + '</p>\n' +
  '</li>';
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