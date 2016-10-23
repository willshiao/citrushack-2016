'use strict';

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
  $('#'+data.slug).remove();
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
  $('#tasks').prepend(task.isChecklist ?
      makeChecklistElement(task) :
      makeTaskElement(task));
});

function clearTasks() {
  $('#tasks').html('');
}

function makeTaskElement(task) {
  return '<div class="card card-block tasks" id="' + task.slug + '">\n' +
    '<h4 class="card-title task-title">' + escapeHtml(task.name) + '</h4>\n' +
    '<button type="button" class="close close-btn">&times;</button>\n' +
    '<p class="task-content">' + escapeHtml(task.content || '') + '</p>\n' +
    '</div>';
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

(function () {
    var Message;
    Message = function (arg) {
        this.text = arg.text, this.message_side = arg.message_side;
        this.draw = function (_this) {
            return function () {
                var $message;
                $message = $($('.message_template').clone().html());
                $message.addClass(_this.message_side).find('.text').html(_this.text);
                $('.messages').append($message);
                return setTimeout(function () {
                    return $message.addClass('appeared');
                }, 0);
            };
        }(this);
        return this;
    };
    $(function () {
        var getMessageText, message_side, sendMessage;
        message_side = 'right';
        getMessageText = function () {
            var $message_input;
            $message_input = $('.message_input');
            return $message_input.val();
        };
        sendMessage = function (text) {
            var $messages, message;
            if (text.trim() === '') {
                return;
            }
            $('.message_input').val('');
            $messages = $('.messages');
            message_side = message_side === 'left' ? 'right' : 'left';
            message = new Message({
                text: text,
                message_side: message_side
            });
            message.draw();
            return $messages.animate({ scrollTop: $messages.prop('scrollHeight') }, 300);
        };
        $('.send_message').click(function (e) {
            return sendMessage(getMessageText());
        });
        $('.message_input').keyup(function (e) {
            if (e.which === 13) {
                return sendMessage(getMessageText());
            }
        });
        sendMessage('Hello Philip! :)');
        setTimeout(function () {
            return sendMessage('Hi Sandy! How are you?');
        }, 1000);
        return setTimeout(function () {
            return sendMessage('I\'m fine, thank you!');
        }, 2000);
    });
}.call(this));
