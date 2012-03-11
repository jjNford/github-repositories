var Filter = function(type) {

	// Set type and load last setting.
	this.type = type;
	this.selected = Storage.load("filter." + type);
	
	if(!this.selected) {
			this.selected = 'item';
	}

	// Determing HTML function relevent to type.
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
	
	bind: function() {

		var that = this;

		// Set selected filter.
		jQuery('.filters .types li[type="' + this.selected + '"]').addClass('selected');

		// Set type selection events.
		var types = jQuery('.filters .types li');
		types.on('click', function() {
			types.each(function() {
				jQuery(this).removeClass('selected');
			});	
			jQuery(this).addClass('selected');
			that.selected = jQuery(this).attr('type');
			Storage.save("filter." + that.type, that.selected);
			window[that.type].filter.dom();
		});
	
		// Remove defualt text from input box on click event.
		var input = jQuery('.filters .search');
		input.one('click', function() {
			input.val("");
			input.removeClass('dead');
		});

		// Instant search event.
		input.keyup(function() {
			var regExp = new RegExp(jQuery(this).val(), 'i');
			jQuery('.content .item').each(function() {
				var item = jQuery(this);
				if(item.hasClass(that.selected) && item.attr('tags').match(regExp)) {
					item.closest('li.item').show();
				}
				else {
					item.closest('li.item').hide();
				}
			})
		})
	},
	
	html: {
	
		/**
		 * @return Follows filter HTML.
		 */
		follows: function() {
			return "<div class='filters follows'>"
			     + "<div class='search_wrapper'>"
			     + "<input type='text' class='search dead' value='Find User...' />"
			     + "</div>"
				 + "</div>";
		},
	
		/**
		 * @return Repositories filter HTML.
		 */
		repos: function() {
			return "<div class='filters'>"
			     + "<div class='search_wrapper'>"
			     + "<input type='text' class='search dead' value='Find Repository...' />"
			     + "</div>"
			     + "<ul class='types'>"
			     + "<li type='item'>All Repositories</li>"
			     + "<li type='fork'>Forks</li>"
			     + "<li type='source'>Sources</li>"
			     + "<li type='private'>Private</li>"
		         + "<li type='public'>Public</li>"
			     + "</ul>"
		         + "</div>";
		}
	},
	
	data: {

		/**
		 * Sort data set by newest created items to oldest created items.
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
		 * Sort data set by most recently pushed items to last recently pushed items.
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
		 * Remove user repositories from repo set.
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
	},
	
	/**
	 * Filter the DOM dynamically based on currently set filter and instant search.
	 */
	dom: function(item) {
		var that = this;

		if(item) {
			filterItem(item);
		}
		else {
			jQuery('.item').each(function() {
				filterItem(jQuery(this));
			});
		}

		// Apply filter to an item.
		function filterItem(item) {
			if(item.hasClass(that.selected)) {

				// If instant search is not being used.
				if(jQuery('.filters .search').hasClass('dead')) {
					item.show();
				}

				// If instant search is being used.
				else {
					var regExp = new RegExp(jQuery('.filters .search').val(), 'i');
					if(item.attr('tags').match(regExp)) {
						item.show();
					}
					else {
						item.hide();
					}
				}
			}
			else {
				item.hide();
			}
		}
	}
};