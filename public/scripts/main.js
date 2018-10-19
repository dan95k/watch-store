$('.dropdown-toggle').click(function() {
  $(this).next('.dropdown-menu').slideToggle(250);
});
  $("#success-alert").fadeTo(2000, 500).delay(3000).slideUp(500, function(){
    $("#success-alert").slideUp(500);
});
  $("#alert-danger").fadeTo(2000, 500).delay(3000).slideUp(500, function(){
    $("#alert-danger").slideUp(500);
});
 $('.carousel').carousel()


