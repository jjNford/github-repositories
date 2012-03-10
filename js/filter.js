var Filter = function(type) {
	this.type = type;
	this.selected = Storage.load("filter." + type);
	
	if(!this.selected) {
			this.selected = 'all';
	}

	switch(this.type) {
		case "Repos":
			this.html = Filter.prototype.html.repos;
			break;
		case "Watched":
			this.html = Filter.prototype.html.repos;
			break;
		case "Followers":
			this.html = Filter.prototype.html.follows;
			break;
		case "Following":
			this.html = Filter.prototype.html.follows;
			break;
		default:
			break;
	}
};
	
Filter.prototype = {
	
	apply: function() {
	
		console.log(this.selected);
		//console.log(jQuery('li.item').hasClass(this.selected));
	},
	
	bind: function() {

		var that = this;

		// Set selected filter.
		//console.log(jQuery('.filters .type .private'));
		//jQuery('.filters .type[type]).addClass('selected');

		// Type selection.
		var types = jQuery('.filters .types li');
		types.on('click', function() {
			types.each(function() {
				jQuery(this).removeClass('selected');
			});
			jQuery(this).addClass('selected');	
			Storage.save("filter." + that.type, jQuery(this).attr('type'));
		});
	
		// Input box.
		var input = jQuery('.filters .search');
		input.one('click', function() {
			input.val("");
		});

		// Instant search.
		input.keyup(function() {
			var regExp = new RegExp(jQuery(this).val(), 'i');
			jQuery('.content .item').each(function() {
				if(jQuery(this).attr('tags').match(regExp)) {
					jQuery(this).closest('li.item').show();
				}
				else {
					jQuery(this).closest('li.item').hide();
				}
			})
		})
	},
	
	html: {
	
		/**
		 * Follows
		 * 
		 * @return Follows filter HTML.
		 */
		follows: function() {
			return "<div class='filters follows'>"
			     + "<div class='search_wrapper'>"
			     + "<input type='text' class='search' value='Find User...' />"
			     + "</div>"
				 + "</div>";
		},
	
		/**
		 * Repos
		 * 
		 * @return Repositories filter HTML.
		 */
		repos: function() {
			return "<div class='filters'>"
			     + "<div class='search_wrapper'>"
			     + "<input type='text' class='search' value='Find Repository...' />"
			     + "</div>"
			     + "<ul class='types'>"
			     + "<li type='all'>All Repositories</li>"
			     + "<li type='forks'>Forks</li>"
			     + "<li type='sources'>Sources</li>"
			     + "<li type='private'>Private</li>"
		         + "<li type='public'>Public</li>"
			     + "</ul>"
		         + "</div>";
		}
	},
	
	data: {

		/**
		 * Created At
		 * 
		 * @param data Data to be sorted.
		 * @return Sorted data.
		 */
		createdAt: function(data) {
			if(data && data.length > 0) {
				data.sort(function(a, b) {
					var a = new Date(a.created_at).getTime();
					var b = new Date(b.created_at).getTime();
					if(a > b) return -1;
					if(a < b) return 1;
					return 0;
				});
			}
			return data;
		},

		/**
		 * Recently Pushed
		 * 
		 * @param repos Repositories to sort.
		 * @return Sorted repositories.
		 */
		recentlyPushed: function(repos) {
			if(repos && repos.length > 0) {
				repos.sort(function(a, b) {
					var a = new Date(a.pushed_at).getTime();
					var b = new Date(b.pushed_at).getTime();
					if(a > b) return -1;
					if(a < b) return 1;
					return 0;
				});
			}
			return repos;
		},
	
		/**
		 * Remove Users Repos
		 * 
		 * @param repos Set of repos to remove own repos from.
		 * @param login Users login.
		 * @return The set of repos not containing owned repos.
		 */
		removeUserRepos: function(repos, login) {
			if(repos.length == 0) {
				return repos;
			}
			for(var i = (repos.length - 1); i >= 0; i--) {
				if(repos[i].owner.login == login) {
					repos.splice(i, 1);
				}
			}
			return repos;
		}
	}
};