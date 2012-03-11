window.Settings = {
	
	init: function() {
	
		this.PREF_NOTIFICATIONS = "settings.notifications";
	
		// Set DOM references.
		this.panel = jQuery('#settings');
		this.button = jQuery('.user_links li[rel="extension_settings"]');
		this.cacheButton = this.panel.find('.caching button');
		this.notificationsButton = this.panel.find('.notifications button');
		this.emptyButton = this.panel.find('.empty_cache button');
	
		// Initialize caching button.
		if(Cache.isEnabled() === true) {
			this.cacheButton.addClass('positive');
		}
		else {
			this.cacheButton.addClass('negative');
		}

		// Initialize notifications button.
		if(Storage.load(this.PREF_NOTIFICATIONS) === true) {
			this.notificationsButton.addClass('positive');
		}
		else {
			this.notificationsButton.addClass('negative');
		}
	
		this.bind();
	},
	
	bind: function() {

		// Set click event and animation to settings button.
		this.button.on('click', function() {
			if(Settings.panel.is(':visible')) {
				Settings.panel.slideUp(500, function() {
					Content.article.css('overflow-y', 'auto');
				});
				Settings.button.removeClass('active');
			}
			else {
				Settings.button.addClass('active');
				Content.article.css('overflow-y', 'hidden');
				Settings.panel.slideDown(500);
			}
		});
	
		// Toggle notification preference.
		this.notificationsButton.on('click', function() {
			if(Storage.load(this.PREF_NOTIFICATIONS) === false) {
				Storage.save(this.PREF_NOTIFICATIONS, true);
				Settings.notificationsButton.removeClass('negative').addClass('positive');
			}
			else {
				Storage.save(this.PREF_NOTIFICATIONS, false);
				Settings.notificationsButton.removeClass('positive').addClass('negative');
			}
		});

		// Toggle caching preference.
		this.cacheButton.on('click', function() {
			if(Cache.isEnabled() === false) {
				Cache.setEnabled(true);
				Settings.cacheButton.removeClass('negative').addClass('positive');
			}
			else {
				Cache.setEnabled(false);
				Cache.clear();
				Settings.cacheButton.removeClass('positive').addClass('negative');
			}
		});
	
		// Empty cache.
		this.emptyButton.on('click', function() {
			Cache.clear();
		});
	}
};