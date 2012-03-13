window.Settings = {
	
	/**
	 * Init
	 */
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
		if(Storage.load(this.PREF_NOTIFICATIONS) === false) {
			this.notificationsButton.addClass('negative');
		}
		else {
			this.notificationsButton.addClass('positive');
		}
	
		this.bind();
	},
	
	/**
	 * Bind
	 */
	bind: function() {

		// Bind hover event to octocat.
		this.panel.find('.octocat').hover(function() {
			jQuery(this).animate({right: "0"}, 1000);
		}, function() {
			jQuery(this).stop(true, false).animate({right: "-25px"}, 1000);
		});

		// Bind click event to settings button.
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
	
		// Bind click event to notifications button.
		this.notificationsButton.on('click', function() {
			if(Storage.load(Settings.PREF_NOTIFICATIONS) === false) {
				Storage.save(Settings.PREF_NOTIFICATIONS, true);
				Settings.notificationsButton.removeClass('negative').addClass('positive');
			}
			else {
				Storage.save(Settings.PREF_NOTIFICATIONS, false);
				Settings.notificationsButton.removeClass('positive').addClass('negative');
			}
			
			Socket.postMessage({
				namespace: "window", 
				literal: "Notifier", 
				method: "update"
			});
		});

		// Bind click event to caching button.
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
	
		// Bind click event to empty cache button.
		this.emptyButton.on('click', function() {
			Cache.clear();
		});
	}
};