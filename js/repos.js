(function() {
	
	// Keep in global namespace for background page.
	window.Repos = {
	
		init: function(){
			this.name = "repos";
			window[this.name] = this;
		},
		
		bind: {
			list: function(){},
			item: function(){}
		},
		
		display: {
			append: function() {},
			list: function() {},
		},
		
		html: {
			item: function() {},
			list: function() {}
		},
		
		load: {
			
			/**
			 * Cache
			 * 
			 * @param context Context requesting load.
			 */
			cache: function(context) {
				var cache = Cache.load(context.id, App.repos.name);
				Repos.display.list(context.id, cache.data);
				if(!cache || cache.expired) {
					App.repos.load.refresh(context);
				}
			},
			
			/**
			 * Github
			 * 
			 * @param context Context requesting repositories.
			 * @param token Users OAuth2 token.
			 */
			github: function(context, token) {
				if(context.type == "User") {
					getUserRepos([], 1);
				}
				else {
					getOrgRepos([], 1);
				}
				
				/* GitHub onlly returns 40 repositories per page - use recursion to retreive all
				 * repositories. When all user repositories have been retreived, GitHub returns
				 * and empty array. When all organization repositories have been retreived, GitHub
				 * returns last page again.
				 *  
				 */
				function getUserRepos(buffer, page) {
					jQuery.getJSON("https://api.github.com/user/repos", {access_token: token, page: page})
						.success(function(json) {
							if(json.length > 0) {
								getUserRepos(buffer.concat(json), ++page);
							}
							else {
								// TODO: sort in date order first.
								getParents(buffer, 0);
							}
						});
				};
				
				function getOrgRepos(buffer, page, last) {
					jQuery.getJSON("https://api.github.com/orgs/" + context.login + "/repos", {access_token: token, page: page})
						.success(function(json) {
							if(json.length == 0 || (last != null && json[json.length - 1].id == last.id)) {
								// TODO: sort in date order first.
								getParents(buffer, 0);
							}
							else {
								buffer = buffer.concat(json);
								getOrgRepos(buffer, ++page, buffer[buffer.length - 1]);
							}
						});
				};
				
				function getParents(buffer, index) {
					if(index < buffer.length) {
						if(buffer[index].fork) {
							jQuery.getJSON("https://api.github.com/repos/" + context.login + "/" + buffer[index].name, {access_token: token})
								.success(function(json) {
									buffer[index] = json;
									// TODO: send to popup up with socket.
									console.log(json);
									getParents(buffer, ++index);
								})
								
								/* 404 error is thrown when a forked org repo name has changed and 
								 * that org is trying to load its repos parents. GitHub does not
								 * show these repositories as the main org page so they will be 
								 * hidden. To display them uncomment the first block of code and
								 * comment out the second block of code below.
								 * 
								 */
								.error(function(json) {
									
									// Block 1:
									// jQuery.getJSON("https://api.github.com/repos" + buffer[index].owner.login + "/" + buffer[index].name, {access_token: token})
									//     .success(function(json) {
									//         buffer[index] = json;
									//         // TODO: send to popup with socket.
									//         getParents(buffer, ++index);
									//     });
									
									// Block 2:
									buffer.splice(index, 1);
									getParents(buffer, index);
								});
								
						}
						else {
							// TODO: send to popup with socket.
							console.log(buffer[index]);
							getParents(buffer, ++index);
						}
					}
					else {
						Cache.save(context.id, Repos.name, buffer);
						// TODO: notify popup that background loading is complete.
					}
				};
			},
			
			/**
			 * Refresh
			 *
			 * @param context Context requesting refresh.
			 */
			refresh: function(context) {
				Socket.postMessage("Repos", "load", "github", [context, OAuth2.getToken()]);
			}
		}
	};
	
	Repos.init();
})();