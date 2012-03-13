(function() {

	// XMLHttpRequest Factory
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
	
	window.Notifier = {

		init: function() {
			this.CHECK_INTERVAL = 1000 * 60;
			this.LOGIN = "login";
			this.NOTIFICATIONS_URL = "https://github.com/inbox/notifications";
			this.PREF_NOTIFICATIONS = "settings.notifications";

			this.bind();
			this.update();
		},

		bind: function() {
			setInterval(this.update, this.CHECK_INTERVAL);
		},
	
		/**
		 * Render Google Chrome Extension icon badge and attemp to send notification count to popup.
		 */
		render: function(count) {
			chrome.browserAction.setBadgeBackgroundColor({
				color: [255, 132, 55, 225]
			});
			chrome.browserAction.setBadgeText({
				text: count
			});
			
			// Send notification count to popup.
			Socket.postMessage({
				namespace: "App", 
				literal: "update", 
				method: "notifications", 
				args: [count]
			});
		},

		/**
		 * Check for notificaitons.
		 */
		update: function() {
			var user = Storage.load(Notifier.LOGIN);

			// Only request XMLHttp request if exention is logged in.
			if(!user) {
				Notifier.render('');
			}
			else {

				// Get current notifications setting.
				var enabled = Storage.load(Notifier.PREF_NOTIFICATIONS);
				if(enabled === undefined) {
					Storage.save(Notifier.PREF_NOTIFICATIONS, true);
					enabled = true;
				}

				// If notifications are disabled.
				if(enabled === false) {
					Notifier.render('');
				}
	
				// If notifications are enabled.
				else {
					xhr('GET', Notifier.NOTIFICATIONS_URL, function(data) {
						var count = '';
	
						// Transform data into DOM items.
						var wrapper = document.createElement('div');
						wrapper.innerHTML = data;

						// If name element does not exist, user is not logged into GitHub.
						var nameElement = wrapper.querySelector('a.name');

						if(nameElement) {
							var githubName = nameElement.textContent;
							if(githubName) {

								// Make sure extension user is the same as logged user.
								if(githubName == user) {
									var countElement = wrapper.querySelector('.unread_count');
									var count = countElement ? countElement.textContent : '';
								}
							}
						}

						Notifier.render(count);
					});
				}
			}	
		}
	};
	
	Notifier.init();
	
})();