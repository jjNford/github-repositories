(function() {
	
	var Follows = function(name) {
		this.filter = new Filter(name);
	};
	
	Follows.prototype = {
	
		display: {
	
			/**
			 * Append
			 * 
			 * @param user User to append to display.
			 */
			append: function(contextId, user, name) {
				//console.log(user);
			},
	
			/**
			 * List
			 * 
			 * @param contextId Context ID requesting display.
			 * @param users User to be displayed.
			 */
			list: function(contextId, users, name) {
				App.content.post(contextId, name, function() {
					App.content.display(window[name].html.list(users, name));
				});
			}
		},
	
		html: {

			/**
			 * Item
			 * 
			 * @param user Item to generate HTML for.
			 * @return User list item HTML.
			 */
			item: function(user) {	
				return "<li>"
				     + "<a href='https://github.com/" + user.login + "' target='_blank'>"
				 	 + "<img src='" + (user.avatar_url ? user.avatar_url : "undefined") + "' />"
					 + "</a>"
					 + "<a href='https://github.com/" + user.login + "' target='_blank'>"
					 + user.login
					 + "</a>"
					 + (user.name ? (" <em>(" + user.name + ")</em>") : "")
					 + "</li>";
			},

			/**
			 * List
			 * 
			 * @param users Users to create HTML list for.
			 * @param name Type to create filter for.
			 * @return Users list HTML.
			 */
			list: function(users, name) {
				var html = window[name].filter.html();
				html += "<ul class='follows'>";

				if(users) {
					for(var i in users) {
						html += this.item(users[i]);
					}
				}
	
				html += "</ul>";
				return html;
			}
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
					window[name].display.list(context.id, cache.data, name);
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
				var pages = Math.floor(context[type] / 30) + 1;
				var tempBuffer = [];
				var cacheBuffer = [];
	
				if(context[type] == 0) {
					getComplete();
				}
				else {
					getFollows([], 1);
				}

				/* GitHub only returns 30 followers per page.  User recursion to get all followers.
				 * Because of high volume of possible follows, user temporary caching to begin
				 * loading user names before all pages have been pulled.
				 * 
				 */
				function getFollows(buffer, page) {
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
								getFollows(buffer.concat(json), ++page);
							}
						});
				};

				function getUserNames(users, index) {
					jQuery.getJSON("https://api.github.com/users/" + users[index].login)
						.success(function(json) {

							// Pull user name and add to cacheBuffer.
							users[index].name = json.name;
							users[index].created_at = json.created_at;
							cacheBuffer = cacheBuffer.concat(users[index]);
							Socket.postMessage(name, "display", "append", [context.id, users[index], name]);
	
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
					cacheBuffer = window[name].filter.data.createdAt(cacheBuffer);
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
	window.Followers = new Follows("Followers");
	window.Following = new Follows("Following");	

})();