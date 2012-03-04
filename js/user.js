/**
 * User
 * 
 * 
 */
window.App.user = {
	
	/**
	 * Initializes user.
	 */
	init: function() {
		this._key = "content";
		this.load();
	},
	
	/**
	 * Loads the user object belonging to the context ID currently stored in user.context.
	 */
	load: function() {
		if(this.context == null) {
			this.context = Storage.load(this._key);
		}
		
		// Check self.
		if(this.context != null && this.context.id == this.id) {
			this.context = this;
			return;
		}
		
		// Check organizations.
		if(this.orgs.length == 0) {
			this.context = this;
		}
		else {
			for(var i = 0; i < this.orgs.length; i++) {
				if(this.context == this.orgs[i].id) {
					this.context = this.orgs[i];
					break;
				}
			}
			if(this.context == null || this.context.login == null || this.context.id == null) {
				this.context = this;
			}
		}
		
		// Save last used context.
		Storage.save(this._key, this.context.id);
	},
	
	/**
	 * Updates the context user object to that with the given ID.
	 * 
	 * @param contextId Context ID of user object to update & load.
	 */
	update: function(contextId) {
		if(contextId != null) {
			Storage.save(this._key, contextId);
			this.context = contextId;
		}
		this.load();
	}
};