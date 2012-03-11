window.App.settings = {
	
	/**
	 * Initialize
	 */
	init: function() {
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
		if(Storage.load("pref.notifications") === true) {
			this.notificationsButton.addClass('positive');
		}
		else {
			this.notificationsButton.addClass('negative');
		}
	
		this.bind();
	},
	
	/**
	 * Bind
	 */
	bind: function() {
		this.button.on('click', function() {
			if(App.settings.panel.is(':visible')) {
				App.settings.panel.slideUp(500, function() {
					App.content.article.css('overflow-y', 'auto');
				});
				App.settings.button.removeClass('active');
			}
			else {
				App.settings.button.addClass('active');
				App.content.article.css('overflow-y', 'hidden');
				App.settings.panel.slideDown(500);
			}
		});
	
		// Toggle notification preference.
		this.notificationsButton.on('click', function() {
			if(Storage.load("pref.notifications") === false) {
				Storage.save("pref.notifications", true);
				App.settings.notificationsButton.removeClass('negative').addClass('positive');
			}
			else {
				Storage.save("pref.notifications", false);
				App.settings.notificationsButton.removeClass('positive').addClass('negative');
			}
		});

		// Toggle caching preference.
		this.cacheButton.on('click', function() {
			if(Cache.isEnabled() === false) {
				Cache.setEnabled(true);
				App.settings.cacheButton.removeClass('negative').addClass('positive');
			}
			else {
				Cache.setEnabled(false);
				Cache.clear();
				App.settings.cacheButton.removeClass('positive').addClass('negative');
			}
		});
	
		// Empty cache.
		this.emptyButton.on('click', function() {
			Cache.clear();
		});
	}
};