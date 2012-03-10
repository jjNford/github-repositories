var Filter = function(type) {
	this.type = type;
	this.init();
};
	
Filter.prototype = {
	
	init: function() {
		switch(this.type) {
			case ("Repos"):
				this.html = Filter.prototype.html.repos;
				break;
			case ("Watched"):
				this.html = Filter.prototype.html.repos;
				break;
			default:
				break;
		}
	},
	
	html: {
	
		/**
		 * Repos
		 * 
		 * @return Repositories filter HTML.
		 */
		repos: function() {
			return "<div class='filters'>"
			     + "<div>"
			     + "<input type='text' class='search' />"
			     + "</div>"
			     + "<ul class='type'>"
			     + "<li type='all' class='selected'>All Repositories</li>"
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