function init() {
  $$('.bio').invoke('hide');
  $$('.player-title').each(function(title) {
      key = title.readAttribute('biokey');
      (function(key) {title.observe('click', function(e) {
          toggle(title, key);
      });})(key);
  });
}

function toggle(title, key) {
    var v = $('bio-'+key);
    $$('.player-title').invoke('removeClassName', 'selected');
    if (v.visible()) {
			  v.hide();
    } else {
        $$('.bio').invoke('hide');
			  title.addClassName('selected');
			  v.show();
    }
}

Event.observe(window, 'load', init);

