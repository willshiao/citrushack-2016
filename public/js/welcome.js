$(function() {
  $('#register-form').submit(function(evt) {
    evt.preventDefault();
    $('#register-warning').hide();

    $.post({
      url: '/register',
      data: $(this).serialize(),
      dataType: 'json',
    }).done(function(data) {
      console.log('Done:', data);
      if(data.success) {
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

    $.post({
      url: '/login',
      data: $(this).serialize(),
      dataType: 'json',
    }).done(function(data) {
      if(data.success) {
        window.location.href = data.redirect;
      } else {
        $('#login-warning').text(data.message).show();
      }
    }).fail(function(err) {
      console.error('Failed:', err);
      if(err.status === 401) {
        $('#login-warning').text('Incorrect username or password.').show();
      }
    });
  });
});