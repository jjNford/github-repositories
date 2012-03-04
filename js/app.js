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

	/**
	 * Initializes application.
	 */
	init: function(){
		App.authentication.validate(function(user) {
			
			// Load application user.
			jQuery.extend(App.user, user);
			App.user.load();
			
			// Initialize components.
			App.switcher.init();
									
			// Show application.
			jQuery('body').removeClass('loading').find('#application').show();
			
		}, function() {
			App.authentication.prompt();
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