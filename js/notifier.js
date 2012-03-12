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

			// Set default notification preference to be off.
			if(Storage.load(this.PREF_NOTIFICATIONS) === undefined) {
				Storage.save(this.PREF_NOTIFICATIONS, true);
			}

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

			Socket.postMessage("App", "update", "notifications", [count]);
		},

		/**
		 * Check for notificaitons.
		 */
		update: function() {
			var loggedName = Storage.load(Notifier.LOGIN);

			// Only load GitHub data if extension is logged in.
			if(loggedName) {
				if(Storage.load(Notifier.PREF_NOTIFICATIONS) === true) {
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
								if(githubName == loggedName) {
									var countElement = wrapper.querySelector('.unread_count');
									var count = countElement ? countElement.textContent : '';
								}
							}
						}
						Notifier.render(count);
					});
				}
			}
			else {
				Notifier.render('');
			}
		}
	};
	
	Notifier.init();
	
})();