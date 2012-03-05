window.App.navigation = {

	/**
	 * Initialize
	 */
	init: function() {	
		this._key = "navigation";		
		this.selected = Storage.load(this._key);
		this.items = {};
			
		// Store navigation DOM elements into associative array.	
		jQuery('.dashboard .navigation li').each(function() {
			App.navigation.items[jQuery(this).attr('rel')] = jQuery(this);
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
				App.navigation.update(jQuery(this).attr('rel'));
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
			tab = Repos.name;
		}
				
		// Updated selected.
		if(tab != this.selected | force) {
			if(this.items[this.selected]) {
				this.items[this.selected].removeClass('selected');
			}
			this.items[tab].addClass('selected');
			
			if(App.user.context.type == "User") {
				if(!this.items[App.WATCHED].is(":visible")) {
					this.items[App.repos.name].removeClass("orgs");
					this.items[App.WATCHED].show();
					this.items[App.FOLLOWING].show();
					this.items[App.FOLLOWERS].show();
				}
			}
			else {
				this.items[App.repos.name].addClass("orgs");
				this.items[App.WATCHED].hide();
				this.items[App.FOLLOWING].hide();
				this.items[App.FOLLOWERS].hide();
			}
			
			this.selected = tab;
			Storage.save(this._key, this.selected);
			// TODO: show loading in content
			// TODO: load content
		}
	}
};