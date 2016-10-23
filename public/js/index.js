$(function() {
  $('#register-form').submit(function(evt) {
    evt.preventDefault();
    $('#register-warning').hide();
    $('#register-success').hide();

    $.post({
      url: '/register',
      data: $(this).serialize(),
      dataType: 'json',
    }).done(function(data) {
      console.log('Done:', data);
      if(data.success) {
        $('#register-success').text('Success!').show();
        window.location.href = data.redirect;
      } else {
        $('#register-warning').text(data.message).show();
      }
    }).fail(function(err) {
      console.log('Failed:', err);
    });
  });

  $('#login-form').submit(function(evt) {
    evt.preventDefault();
    $('#login-warning').hide();
    $('#login-success').hide();

    $.post({
      url: '/login',
      data: $(this).serialize(),
      dataType: 'json',
    }).done(function(data) {
      if(data.success) {
        $('#login-success').text('Success!').show();
        window.location.href = data.redirect;
      } else {
        $('#login-warning').text(data.message).show();
      }
    }).fail(function(err) {
      console.error('Failed:', err);
      if(err.status === 401) {
        $('#login-warning').text('Incorrect username or password.').show();
        $('#log-in-password-input').val('');
      }
    });
  });
});