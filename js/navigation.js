window.Navigation = {

	/**
	 * Initialize
	 */
	init: function() {	
		this._key = "navigation";	
		this.selected = Storage.load(this._key);
		this.items = {};
	
		// Store navigation DOM elements into associative array.	
		jQuery('.dashboard .navigation li').each(function() {
			Navigation.items[jQuery(this).attr('rel')] = jQuery(this);
		});	
	
		this.bind();	
		this.update(this.selected, true);
	},
	
	/**
	 * Bind
	 */
	bind: function() {
		for(var current in this.items) {
			this.items[current].on('click', function() {
				Navigation.update(jQuery(this).attr('rel'));
			});
		}
	},

	/**
	 * Update
	 * 
	 * @param tab Tab to update the navigation to.
	 * @param force Force navigation update (optional).
	 */
	update: function(tab, force) {
		if(tab == null) {
			tab = "Repos";
		}
	
		// Updated selected.
		if(tab != this.selected | force) {
			if(this.items[this.selected]) {
				this.items[this.selected].removeClass('selected');
			}
			this.items[tab].addClass('selected');

			if(User.context.type == "User") {
				if(!this.items["Watched"].is(":visible")) {
					this.items["Repos"].removeClass("orgs");
					this.items["Watched"].show();
					this.items["Following"].show();
					this.items["Followers"].show();
				}
			}
			else {
				this.items["Repos"].addClass("orgs");
				this.items["Watched"].hide();
				this.items["Following"].hide();
				this.items["Followers"].hide();
			}
	
			this.selected = tab;
			Storage.save(this._key, this.selected);
			Content.loading();
			window[this.selected].load.cache(User.context, this.selected);
		}
	}
};