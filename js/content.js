window.Content = {

	/**
	 * Init
	 */
	init: function() {
		this.locked = false;
		this.article = jQuery('.content');
	},

	/**
	 * Post 
	 *
	 * Post a function to the content article.  Posting content to display will guarantee
	 * that the correct context is updating the content article with the correct content.  
	 * Posts are synchronized.
	 * 
	 * @param contextId The user contenxt ID at the time of the call.
	 * @param caller The object type of the caller.
	 * @param fn The function to be posted.
	 */
	post: function(contextId, caller, fn) {
		try {
			if(caller === Navigation.selected && contextId === User.context.id) {
				if(this.locked) {
					this.post(contextId, caller, fn);
				}
				else {
					this.locked = true;
					fn();
					this.locked = false;
				}
			}
		}
		catch(error) {
			// If app is closed, user cannot instansiate again.  Keep open on errors.
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
	 * 
	 * Display loading image.
	 */
	loading: function() {
		this.article.html("").addClass('loading');
	}
};