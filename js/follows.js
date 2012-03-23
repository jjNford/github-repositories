(function() {

	var Follows = function(name) {
		this.filter = new Filter(name);
	};

	Follows.prototype = {

		/**
		 * Display
		 */
		display: {

			/**
			 * Append 
			 * 
			 * @param contextId ID of context requestion display append.
			 * @param user User to append to display.
			 * @param name Name of type (following/followers).
			 */
			append: function(contextId, user, name) {

				var list = jQuery('.follows_list');

				// If a list has not yet been created.
				if(list.length == 0) {
					window[name].display.list(contextId, [user], name);
				}

				// Append the list.
				else {
					if(user) {
						Content.post(contextId, name, function() {
							var old = list.find('li.user[id="' + user.id + '"]');
							var temp = list.find('li.user:first-child');
							var html = window[name].html.item(user);

							// Find insertion point.
							while(temp.length > 0 && temp.attr('created_at') > user.created_at) {
								temp = temp.next();
							}

							// Insert user.
							if(temp.length == 0) {
								list.append(html);
							}
							else {
								jQuery(html).insertBefore(temp);
							}

							// Remove old DOM item if it exists.
							if(old.length > 0) {
								old.remove();
							}
						});
					}
				}
			},
			
			/**
			 * Clean
			 * 
			 * Remove unfollowed users on refresh.
			 * 
			 * @param contextId Context ID requesting clean.
			 * @param followers Full list of followers.
			 * @param name Name of type (following/followers).
			 */
			clean: function(contextId, followers, name) {
				
				var list = jQuery('.follows_list');
				var remove = [];
				
				if(list.attr('type') === name) {
				
					// Look for DOM items to remove.
					list.find('.item').each( function() {
						var item = jQuery(this);
						for(var i = 0; i < followers.length; i++) {
							if(item.attr('id') == followers[i].id) {
								return;
							}
						}
						remove.push(item);
					});

					// Remove deleted repositories from DOM.
					for(var i in remove) {
						remove[i].remove();
					}
				}
			},

			/**
			 * List 
			 * 
			 * @param contextId Context ID requesting display.
			 * @param users User to be displayed.
			 * @param name Name of type. (following/followers).
			 */
			list: function(contextId, users, name) {
				Content.post(contextId, name, function() {
					Content.display(window[name].html.list(users, name));
					window[name].filter.bind();
				});
			}
		},

		/**
		 * HTML
		 */
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
				html += "<ul class='follows_list' type='" + name + "'>";

				if(users) {
					for(var i in users) {
						html += this.item(users[i]);
					}
				}

				html += "</ul>";
				return html;
			}
		},

		/**
		 * Load
		 */
		load: {

			/**
			 * Cache 
			 *
			 * Load following from cache.
			 * 
			 * @param context Context of requesting load.
			 * @param name Type to load cache.
			 */
			cache: function(context, name) {
				var cache = Cache.load(context.id, name);

				if(cache != null) {
					window[name].display.list(context.id, cache.data, name);
				}

				// If data is not cached or cache is expired, refresh the data.
				if(!cache || cache.expired) {
					window[name].load.refresh(context, name);
				}
			},

			/**
			 * GitHub 
			 *
			 * Load following from GitHub (this will run in the background page).
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
					
					Socket.postMessage({
						namespace: name,
						literal: "display",
						method: "append",
						args: [context.id, null, name]
					});
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

				// Load user objects to get user names and date user was created.
				function getUserNames(users, index) {
					jQuery.getJSON("https://api.github.com/users/" + users[index].login)
						.success(function(json) {

							// Pull user name and add to cacheBuffer.
							users[index].name = json.name;
							users[index].created_at = json.created_at;
							cacheBuffer = cacheBuffer.concat(users[index]);
							
							Socket.postMessage({
								namespace: name, 
								literal: "display", 
								method: "append", 
								args: [context.id, users[index], name]
							});

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

				// When all user data has been loaded cache the results.
				function getComplete() {
					cacheBuffer = window[name].filter.data.createdAt(cacheBuffer);
					
					// Clean unwatched repos from display.
					Socket.postMessage({
						namespace: name,
						literal: "display",
						method: "clean",
						args: [context.id, cacheBuffer, name]
					});
					
					Cache.save(context.id, name, cacheBuffer);
					Socket.postTaskComplete();
				}
			},

			/**
			 * Refresh 
			 *
			 * Post a task to the background page to begin loading data from GitHub.
			 * 
			 * @param context Context requesting refresh.
			 * @param name Type to refresh.
			 */
			refresh: function(context, name) {
				Socket.postTask({
					namespace: name, 
					literal: "load", 
					method: "github", 
					args: [context, OAuth2.getToken(), name]
				});
			}
		}
	};

	// Create types.
	window.Followers = new Follows("Followers");
	window.Following = new Follows("Following");

})();