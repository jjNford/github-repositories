(function() {

	window.User = {
	
		/**
		 * Initializes the user and restores last context used.
		 * 
		 * @param user GitHub user object to initialize.
		 */
		init: function(user) {
			jQuery.extend(this, user);
			this.load();
		},
	
		/**
		 * Replaces the context ID stored in User.context with the user object belonging to the ID.
		 */
		load: function() {
	
			// If no context, load from storage.
			if(this.context == null) {
				this.context = Storage.load(Shared.CONTEXT_KEY);
			}
	
			// Check self.
			if(this.context != null && this.context.id == this.logged.id) {
				this.context = this.logged;
				return;
			}
	
			// Check Organization.
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
	
				// If a context is not found, set the context to the logged user object.
				if(this.context == null || this.context.login == null || this.context.id == null) {
					this.context = this.logged;
				}
			}
	
			// Save last used context.
			Storage.save(Shared.CONTEXT_KEY, this.context.id);
		},
	
		/**
		 * Update
		 * 
		 * @param - contextId - Context ID of user object to update & load.
		 */
		update: function(contextId) {
			if(contextId != null) {
				Storage.save(this._key, contextId);
				this.context = contextId;
			}
			this.load();
		}
	};

})();