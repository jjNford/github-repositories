(function() {

	var xhr = function() {
		var xhr = new XMLHttpRequest();
		return function(method, url, callback) {
			xhr.onreadystatechange = function() {
				if(xhr.readyState === 4) {
					callback(xhr.responseText);
				}
			};
			xhr.open(method, url);
			xhr.send();
		};
	}();
	
	/**
	 * Notifier
	 * 
	 */
	var Notifier = {

		/**
		 * Initialize
		 * 
		 */
		init: function() {
			this.NOTIFICATIONS_URL = "https://github.com/inbox/notifications";
			this.CHECK_INTERVAL = 1000 * 60;
			this.bind();
			this.update();
		},

		/**
		 * Bind
		 * 
		 */
		bind: function() {
			setInterval(this.update, this.CHECK_INTERVAL);
		},

		/**
		 * Update
		 * 
		 */
		update: function() {
			xhr('GET', Notifier.NOTIFICATIONS_URL, function(data) {
	
				// Transform data into DOM items.
				var wrapper = document.createElement('div');
				wrapper.innerHTML = data;

				// Make sure extension user is the same as logged user.
				var nameElement = wrapper.querySelector('a.name');
				var githubName = nameElement.textContent;
				var extensionName = Storage.load('login');

				// Get notification count.
				if(githubName) {
					if(githubName == extensionName) {
						var countElement = wrapper.querySelector('.unread_count');
						var count = countElement ? countElement.textContent : '';

						// Create badge.
						chrome.browserAction.setBadgeBackgroundColor({
							color: [255, 132, 55, 225]
						});
						chrome.browserAction.setBadgeText({
							text: count
						});
					}
				}
			});
		}
	};
	
	Notifier.init();
	
})();