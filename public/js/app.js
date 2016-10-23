'use strict';

var roomUsers = [];

socket.on('connect', function() {
  console.log('Connected successfully!');
});

$(function() {
  $('#sortable').sortable();
  $('#sortable').disableSelection();
  $('#tasks').sortable({
    update: function(event, ui) {
      socket.emit('task:reorder', $('#tasks').sortable('toArray'));
    }
  });

  socket.emit('task:get');
  socket.emit('room:users:get');

  $('#tasks').on('click', '.close-btn', function(evt) {
    socket.emit('task:remove', $(evt.target).parent().attr('id'));
  });

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
    $('#room-id-input').val('');
    $('#room-name-input').val('');
  });

  $('#create-room-form').submit(function(evt) {
    evt.preventDefault();
    socket.emit('room:create', {
      roomName: $('#room-name-input').val(),
    });
    $('#room-id-input').val('');
    $('#room-id-input').blur();
    $('#room-name-input').val('');
    $('#room-name-input').blur();
  });

  $('#chat-form').submit(function(evt) {
    evt.preventDefault();
    console.log('Sending chat message...');
    socket.emit('chat:message', $('#chat-text').val());
  });

  $(document).on('click', '#chat-panel .dropdown-menu', function (e) {
    e.stopPropagation();
  });

  $(document).on('click', '.delegate-btn', function(evt) {
    console.log('Target:', $(evt.target).parent().find('.dropdown-menu'));
    addDropdowns($(evt.target).parent().find('.dropdown-menu'));
  });

  $(document).on('click', '.delegate-selector', function(evt) {
    var $this = $(evt.target);
    socket.emit('task:delegate:assign', $this.closest('div.card.tasks').attr('id'), $this.data('slug'));
  });
});

socket.on('chat:message', function(user, msg) {
  console.log('Received chat message:', msg);
  addChatMessage(user, msg);
});

socket.on('room:create:res', function(data) {
  console.log('Got data:', data);
  if(!data.success) return console.error('Failed to create room');
  console.log('Successfully created room');
  roomId = data.roomId;
  $('#room').text(data.name);
  $('#roomId').text('(' + data.roomId + ')');
  clearTasks();
  $('#modal').modal('toggle');
  socket.emit('task:get');
});

socket.on('room:join:res', function(data) {
  console.log('Got response: ', data);
  if(!data.success) return console.error('Failed to join room');
  $('#room').text(data.name);
  $('#roomId').text('(' + data.roomId + ')');
  clearTasks();
  $('#modal').modal('toggle');
  socket.emit('task:get');
});

socket.on('task:removed', function(data) {
  console.log(data.slug, ' was removed...');
  $('#'+data.slug).fadeOut('fast');
});

socket.on('task:new:res', data => {
  if(!data.success) return console.error(data.message);
  console.log('Added new task successfully');
  $('#task-name-input').val('');
  $('#task-name-input').blur();
  $('#task-description').val('');
  $('#task-description').blur();
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

socket.on('room:users:update', function(users) {
  console.log('Setting users:', users);
  roomUsers = users;
});

socket.on('update:task:new', function(task) {
  console.log('Got new task:', task);
  $('#tasks').prepend(task.isChecklist ?
      makeChecklistElement(task) :
      makeTaskElement(task));
});

socket.on('task:delegate:update', function(taskSlug, delegateSlug) {
  console.log('Updating delegate:', delegateSlug);
  const userName = roomUsers.find(usr => usr.slug === delegateSlug).username || 'None';
  console.log('Found user: ', userName);
  $('#' + taskSlug + ' .delegate-name').text(userName);
});

function clearTasks() {
  $('#tasks').html('');
}

function addChatMessage(user, message) {
  var el = '<div class="card card-block col-xs-8';
  if(user === username)
    el += ' offset-xs-4';
  el += '">\n' +
    '<strong>' + user +': </strong>\n' +
    escapeHtml(message) + '\n' +
  '</div>';
  $('#messages').append(el);
  $('#messages').scrollTop(10000);
  $('#chat-text').val('');
  $('#chat-text').blur();
}

function makeTaskElement(task) {
  console.log('Task:', task);
  return '<div class="card card-block tasks" id="' + task.slug + '">\n' +
    '<h4 class="card-title task-title">' + escapeHtml(task.name) + '</h4>\n' +
    '<button type="button" class="close close-btn">&times;</button>\n' +
    '<p class="task-content">' + escapeHtml(task.content || '') + '</p>\n' +
    '<div class="row">\n' +
      '<div class="btn-group col-xs-6">\n' +
        '<button class="btn btn-purple dropdown-toggle delegate-btn" type="button" data-toggle="dropdown">Delegate</button>\n' +
        '<div class="dropdown-menu">\n' +
        '</div>\n' +
      '</div>\n' +
      '<div class="col-xs-6">Delegated to: <em class="delegate-name">' + escapeHtml(task.assignedName || 'None') + '</em></div>\n' +
    '</div>\n' +
    '</div>';
}

function addDropdowns(dropdownMenu) {
  dropdownMenu.html('');
  for(var i = 0; i < roomUsers.length; ++i) {
    dropdownMenu.append('<a class="dropdown-item delegate-selector" data-slug="' + roomUsers[i].slug
      + '">' + roomUsers[i].username + '</a>');
  }
}

function makeChecklistElement(task) {
  var el = '<div class="card card-block tasks" id="' + task.slug + '">\n' +
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