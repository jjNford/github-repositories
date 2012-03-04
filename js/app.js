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

/**
 * Application
 * 
 * 
 */
window.App = {

	API: "https://api.github.com",
	
	FOLLOWERS: "followers",
	FOLLOWING: "following",
	REPOS: "repos",
	WATCHED: "watched",

	/**
	 * Initializes application.
	 */
	init: function(){
		App.authentication.validate(function(user) {
			
			jQuery.extend(App.user, user);
			App.user.init();
			
			App.content.init();
			App.navigation.init();
			App.switcher.init();
								
			App.bind();					
									
			// Show application.
			jQuery('body').removeClass('loading').find('#application').show();
			
		}, function() {
			App.authentication.prompt();
		});
	},
	
	/**
	 * Creates bindings for application components.
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
			// TODO: refresh content.
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
	 * Closes extension.
	 */
	close: function(){
		window.close();
		chrome.tabs.getCurrent(function(tab) {
			chrome.tabs.remove(tab.id, function(){});
		});
	}
};