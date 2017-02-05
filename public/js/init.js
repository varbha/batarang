(function($){
  $(function(){

    $('.button-collapse').sideNav();
    $('.parallax').parallax();
    $('.modal').modal();
    $('.terms').click(function(){
	  $('button.cont').removeClass('disabled');	
	  $('button.cont').addClass('enabled');	
      $('span.me').removeAttr("hidden");
	  $('i.dechanged').removeClass('red-text');
      $('p.changed').css("color","green");
	  $('i.dechanged').addClass('green-text');
	  $('i.dechanged').html('done');
    });
	$('.noterms').click(function(){
		$('button.cont').removeClass('enabled');
		$('span.me').removeAttr("hidden");
		$('p.changed').css("color","red");
		$('i.dechanged').removeClass('green-text');
		$('i.dechanged').addClass('red-text');
		$('i.dechanged').html('error');
		$('button.cont').addClass('disabled');	
		
		
		
		
	});

  }); // end of document ready
})(jQuery); // end of jQuery name space
