window.App.settings = {
	
	/**
	 * Initialize
	 */
	init: function() {
		this.panel = jQuery('#settings');
		this.button = jQuery('.user_links li[rel="extension_settings"]');
		this.cacheButton = this.panel.find('.caching button');
		this.emptyButton = this.panel.find('.empty_cache button');
	
		if(Cache.isEnabled() === true) {
			this.cacheButton.addClass('negative').html("Disable Cache");
		}
		else {
			this.cacheButton.addClass('positive').html("Enable Cache");
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
	
		// Toggle caching preference.
		this.cacheButton.on('click', function() {
			if(Cache.isEnabled() === false) {
				Cache.setEnabled(true);
				App.settings.cacheButton.removeClass('positive').addClass('negative').html("Disable Cache");
			}
			else {
				Cache.setEnabled(false);
				Cache.clear();
				App.settings.cacheButton.removeClass('negative').addClass('positive').html("Enable Cache");
			}
		});
	
		// Empty cache.
		this.emptyButton.on('click', function() {
			Cache.clear();
		});
	}
};