window.App = {
	
	FOLLOWERS: "followers",
	FOLLOWING: "following",
	REPOS: "repos",
	WATCHED: "watched",

	/**
	 * Initialize
	 */
	init: function(){
		App.authentication.validate(function(user) {
			
			jQuery.extend(App.user, user);
			App.user.init();
						
			App.repos = window.Repos;
			
			App.content.init();
			App.navigation.init();
			App.settings.init();
			App.switcher.init();
								
			App.bind();					

			// Show application.
			jQuery('body').removeClass('loading').find('#application').show();
			
		}, function() {
			App.authentication.prompt();
		});
	},
	
	/**
	 * Bind
	 */
	bind: function() {
		
		// Set log out click events.
		jQuery('.user_links li[rel="log_out"]').on('click', function() {
			Storage.clear();
			App.close();
		});
		
		// Set refresh button mouse and click events.
		var refresh = jQuery('.refresh');
		refresh.on('click', function() {
			window[App.navigation.selected].load.refresh(App.user.context);
		});
		refresh.on('mousedown', function() {
			refresh.addClass('down');
		});
		refresh.on('mouseup', function() {
			refresh.removeClass('down');
		});
		refresh.on('mouseleave', function() {
			refresh.removeClass('down');
		});
	},
	
	/**
	 * Close
	 */
	close: function(){
		window.close();
		chrome.tabs.getCurrent(function(tab) {
			chrome.tabs.remove(tab.id, function(){});
		});
	}
};

// Prevent any future conflicts.
$.noConflict();

// Initialize application after page has loaded.
jQuery(window).bind("load", function() {
	if(!Storage.isSupported()) {
		App.close();
	}
	else {
		App.init();
	}
});