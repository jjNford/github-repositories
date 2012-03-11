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
	
				var list = jQuery('.follows_list');
	
				// If a list has not yet been created.
				if(list.length == 0) {
					window[name].display.list(contextId, [user], name);
				}

				// Append the list.
				else {
					App.content.post(contextId, name, function() {
						var old = list.find('li.user[id="' + user.id + '"]');
						var temp = list.find('li.user:first-child');
						var html = window[name].html.item(user);
	
						while(temp.length > 0 && temp.attr('created_at') > user.created_at) {
							temp = temp.next();
						}
	
						if(temp.length == 0) {
							list.append(html);
						}
						else {
							jQuery(html).insertBefore(temp);
						}
	
						if(old.length > 0) {
							old.remove();
						}
					});
				}
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
					window[name].filter.bind();
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

				if(!user) {
					return "";
				}
	
				return "<li class='item user' id='" + user.id + "' created_at='" + user.created_at + "' "
				     + "tags='" + user.login + " " + (user.name ? user.name : "") + "'>"
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
				html += "<ul class='follows_list'>";

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
					Socket.postMessage(name, "display", "append", [context.id, null, name]);
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
					Socket.postTaskComplete();
				}
			},
	
			/**
			 * Refresh
			 * 
			 * @param context Context requesting refresh.
			 * @param name Type to refresh.
			 */
			refresh: function(context, name) {
				Socket.postTask(name, "load", "github", [context, OAuth2.getToken(), name]);
			}
		}
	};

	// Create types.
	window.Followers = new Follows("Followers");
	window.Following = new Follows("Following");	

})();