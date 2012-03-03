$.noConflict();

jQuery(window).bind("load", function() {
	
	/**
	 * Application
	 * 
	 * 
	 */
	window.App = {
	
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
		init: function(){}
	};
	
	// Kill the extension if localStorage is not supported.
	if(!Storage.isSupported()) {
		App.close();
	}
	else {
		App.init();
	}
});