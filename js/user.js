window.App.user = {
	
	/**
	 * Initialize
	 */
	init: function() {
		this._key = "context";
		this.load();
	},
	
	/**
	 * Load
	 */
	load: function() {
		if(this.context == null) {
			this.context = Storage.load(this._key);
		}
	
		// Check self.
		if(this.context != null && this.context.id == this.logged.id) {
			this.context = this.logged;
			return;
		}
	
		// Check organizations.
		if(this.orgs.length == 0) {
			this.context = this.logged;
		}
		else {
			for(var i = 0; i < this.orgs.length; i++) {
				if(this.context == this.orgs[i].id) {
					this.context = this.orgs[i];
					break;
				}
			}
			if(this.context == null || this.context.login == null || this.context.id == null) {
				this.context = this.logged;
			}
		}
	
		// Save last used context.
		Storage.save(this._key, this.context.id);
	},
	
	/**
	 * Update
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