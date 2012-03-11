window.App.content = {

	/**
	 * Initialize
	 */
	init: function() {
		this._locked = false;
		this.article = jQuery('.content');
	},
	
	/**
	 * Post
	 * 
	 * @param contextId The user contenxt ID at the time of the call.
	 * @param caller The object type of the caller.
	 * @param fn The function to be posted.
	 */
	post: function(contextId, caller, fn) {
		try {
			if(caller == App.navigation.selected && contextId == User.context.id) {
				if(this._locked) {
					this.post(contextId, caller, fn);
				}
				else {
					this._locked = true;
					fn();
					this._locked = false;
				}
			}
		}
		catch(error) {
			App.close();
		}
	},
	
	/**
	 * Display
	 * 
	 * @param content The content to be displayed.
	 */
	display: function(content) {
		this.article.removeClass('loading').html(content);
	},
	
	/**
	 * Loading
	 */
	loading: function() {
		this.article.html("").addClass('loading');
	}
};