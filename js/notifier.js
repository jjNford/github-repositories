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

			// Set default notification preference.
			if(!Storage.load(this.PREF_NOTIFICATIONS)) {
				Storage.save(this.PREF_NOTIFICATIONS, true);
			}

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
		 * Render
		 * 
		 */
		render: function(count) {
			chrome.browserAction.setBadgeBackgroundColor({
				color: [255, 132, 55, 225]
			});
			chrome.browserAction.setBadgeText({
				text: count
			});

			Socket.postMessage("window", "App", "update", [count]);
		},

		/**
		 * Update
		 * 
		 */
		update: function() {
			if(Storage.load(Notifier.PREF_NOTIFICATIONS) === true) {
				xhr('GET', Notifier.NOTIFICATIONS_URL, function(data) {
					var count = '';
	
					// Transform data into DOM items.
					var wrapper = document.createElement('div');
					wrapper.innerHTML = data;

					// Make sure extension user is the same as logged user.
					var nameElement = wrapper.querySelector('a.name');

					if(nameElement) {
						var githubName = nameElement.textContent;
						var extensionName = Storage.load(Notifier.LOGIN);

						if(githubName) {
							if(githubName == extensionName) {
								var countElement = wrapper.querySelector('.unread_count');
								var count = countElement ? countElement.textContent : '';
							}
						}
					}
					Notifier.render(count);
				});
			}
			else {
				Notifier.render('');
			}
		}
	};
	
	Notifier.init();
	
})();