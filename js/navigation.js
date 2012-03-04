/**
 * Navigation
 * 
 * 
 */
window.App.navigation = {

	_key: "navigation",

	/**
	 * Initializes navigation.
	 */
	init : function() {
		this.selected = Storage.load(this._key);
		this.items = {};
				
		// Collect navigation tabs.
		jQuery('.dashboard .navigation li').each(function() {
			var temp = jQuery(this);
			App.navigation.items[temp.attr('rel')] = temp;
			temp.on('click', function() {
				App.navigation.update(temp.attr('rel'));
			});
		});
		
		this.update(this.selected, true);
	},

	/**
	 * Updates navigation.
	 * 
	 * @param tab Tab to update the navigation to.
	 * @param force Force navigation update (optional).
	 */
	update : function(tab, force) {
		if(tab == null) {
			tab = App.REPOS;
		}
				
		// Updated selected.
		if(tab != this.selected | force) {
			if(this.items[this.selected]) {
				this.items[this.selected].removeClass('selected');
			}
			this.items[tab].addClass('selected');
			
			if(App.user.context.type == "User") {
				if(!this.items[App.WATCHED].is(":visible")) {
					this.items[App.REPOS].removeClass("orgs");
					this.items[App.WATCHED].show();
					this.items[App.FOLLOWING].show();
					this.items[App.FOLLOWERS].show();
				}
			}
			else {
				this.items[App.REPOS].addClass("orgs");
				this.items[App.WATCHED].hide();
				this.items[App.FOLLOWING].hide();
				this.items[App.FOLLOWERS].hide();
			}
			
			this.selected = tab;
			Storage.save(this._key, tab);
			// TODO: show loading in content
			// TODO: load content
		}
	}
};