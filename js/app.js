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
	 * Closes extension.
	 */
	close: function(){
		window.close();
		chrome.tabs.getCurrent(function(tab) {
			chrome.tabs.remove(tab.id, function(){});
		});
	},

	/**
	 * Initializes extension application.
	 */
	init: function(){
		App.authentication.validate(function(user) {
			// TODO - User validated successfully
		}, function() {
			App.authentication.prompt();
		});
	}
};