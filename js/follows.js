(function() {
	
	var Follows = function(name) {};
	
	Follows.prototype = {
	
		display: {
			append: function(contextId, user) {
				console.log(user);
			},
			list: function(contextId, users) {}
		},
	
		html: {
			item: function(user) {},
			list: function(users) {}
		},
	
		load: {
	
			/**
			 * Cache
			 * 
			 * @param context Context of requesting load.
			 * @param name Type to load cache.
			 */
			cache: function(context, name) {
				var cache = Cache.load(context.id, name);

				if(cache != null) {
					window[name].display.list(context.id, cache.data);
				}
	
				if(!cache || cache.expired) {
					window[name].load.refresh(context, name);
				}
			},

			/**
			 * GitHub
			 * 
			 * @param context Context requesting follows.
			 * @param token Users OAuth2 token.
			 * @param name Type to load from GitHub.
			 */
			github: function(context, token, name) {
				var type = name.toLowerCase();
				var pages = context[type] % 30 + 1;
				var tempBuffer = [];
				var cacheBuffer = [];
	
				if(context[type] == 0) {
					getComplete();
				}
				else {
					getFollowing([], 1);
				}

				/* GitHub only returns 30 followers per page.  User recursion to get all followers.
				 * Because of high volume of possible following, user temporary caching to begin
				 * loading user names before all pages have been pulled.
				 * 
				 */
				function getFollowing(buffer, page) {
					jQuery.getJSON("https://api.github.com/user/" + type, {access_token: token, page: page})
						.success(function(json) {

							// If temp buffer exists, load user names.
							if(tempBuffer.length > 0) {
								getUserNames(tempBuffer, 0);
								tempBuffer = [];
							}

							// Save to temp buffer and recurse.
							if(json.length > 0) {
								tempBuffer = json;
								getFollowing(buffer.concat(json), ++page);
							}
						});
				};

				function getUserNames(users, index) {
					jQuery.getJSON("https://api.github.com/users/" + users[index].login)
						.success(function(json) {

							// Pull user name and add to cacheBuffer.
							users[index].name = json.name;
							cacheBuffer = cacheBuffer.concat(users[index]);
							Socket.postMessage(name, "display", "append", [context.id, users[index]]);
	
							if(index < users.length - 1) {
								getUserNames(users, ++index);
							}
							else {
								if(--pages == 0) {
									getComplete();
								}
							}
						});
				};

				function getComplete() {
					Cache.save(context.id, name, cacheBuffer);
					Socket.postComplete();
				}
			},
	
			/**
			 * Refresh
			 * 
			 * @param context Context requesting refresh.
			 * @param name Type to refresh.
			 */
			refresh: function(context, name) {
				Socket.postMessage(name, "load", "github", [context, OAuth2.getToken(), name]);
			}
		}
	};

	// Create types.
	window.Followers = new Follows();
	window.Following = new Follows();	

})();