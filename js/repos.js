(function() {
		
	// Keep in global namespace for background page.
	window.Repos = {
	
		init: function(){
			this.name = "Repos";
		},
		
		bind: {
			
			/**
			 * List
			 */
			list: function() {
				jQuery('.repo_list li.repo').each(function() {
					Repos.bind.item(jQuery(this));
				});
			},
			
			/**
			 * Item
			 * 
			 * @param DOM item to bind events to.
			 */
			item: function(item) {
				var about = item.find('.repo_about');
				var extras = item.find('.repo_extras');
				var links = extras.find('.links');
				var input = extras.find('input');
				var zip = extras.find('.zip');
				var copy = extras.find('.copy');
				
				// Toggle cloning area.
				about.on('click', function() {
					extras.slideToggle(225);
					about.toggleClass('opened');
				});
				
				// Select all text on input box click.
				input.on('click', function() {
					jQuery(this).select();
				});
				
				// Add mouse events to zip button.
				zip.on('mousedown', function() {
					jQuery(this).addClass('down');
				});
				zip.on('mouseleave', function() {
					jQuery(this).removeClass('down');
				});
				zip.on('mouseup', function() {
					jQuery(this).removeClass('down');
				});
				
				// Change input to match current link and copy to clipboard.
				links.find('li').each(function() {
					var element = jQuery(this);
					if(element.attr('rel') != "input") {
						element.on('click', function(event) {
							element.siblings().removeClass('selected');
							element.addClass('selected');
							
							input.val(element.attr('data'));
							input.select();
							document.execCommand("copy");
							input.blur();
							
							copy.fadeIn(100).delay(500).fadeOut(100);
						});
					}
				});
			}
		},
		
		display: {
			
			/**
			 * Append
			 * 
			 * @param repo Repository to append to display.
			 */
			append: function(contextId, repo) {
				
				var list = jQuery('.repo_list');
				
				// If a list has not yet been created.
				if(list.length == 0) {
					App.content.post(contextId, Repos.name, function() {
						App.content.display(Repos.html.list([repo]));
						Repos.bind.list();
					});
				}
				
				// Append the list.
				else {
					App.content.post(contextId, Repos.name, function() {
						var old = list.find('li.repo[id="' + repo.id + '"]');
						var temp = list.find('li.repo:first-child');
						var html = Repos.html.item(repo);
					
						while(temp.length > 0 && temp.attr('time') > repo.pushed_at) {
							temp = temp.next();
						}
					
						if(temp.length == 0 || repo.pushed_at == null) {
							list.append(html);
						}
						else {
							jQuery(html).insertBefore(temp);
						}
					
						repo = list.find('li.repo[id="' + repo.id + '"]');
					
						if(old.length > 0) {
							if(old.find('.repo_extras').is(':visible')) {
								repo.find('.repo_extras').show();
								repo.find('.repo_about').addClass('opened');
							}
							old.remove();
						}
					
						Repos.bind.item(repo);
					});
				}
			},
			
			/**
			 * List
			 * 
			 * @param contextId Context ID requesting display.
			 * @param repos Repositories to be displayed.
			 */
			list: function(contextId, repos) {
				App.content.post(contextId, Repos.name, function() {
					App.content.display(Repos.html.list(repos));
					Repos.bind.list();
				});
			}
		},
		
		filter: {
			
			/**
			 * Recently Pused
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
			}
		},
		
		html: {
			
			/**
			 * Item
			 * 
			 * @param repo Item to generate HTML for.
			 * @return Repo list item HTML.
			 */
			item: function(repo) {
				return "<li class='repo " + (repo['private'] ? "private" : "public") + (repo.fork ? " fork" : " source" ) + "' id='" + repo.id + "' time='" + repo.pushed_at + "'>"
				    + "<ul class='repo_stats'>"
					+ "<li>" + (repo.language ? repo.language : "") + "</li>"
					+ "<li class='watchers'>"
					+ "<a href='" + repo.html_url + "/watchers' target='_blank'>" + repo.watchers + "</a>"
					+ "</li>"
					+ "<li class='forks'>"
					+ "<a href='" + repo.html_url + "/network' target='_blank'>" + repo.forks + "</a>"
					+ "</li>"
					+ "</ul>"
					+ "<span class='repo_id'>"
					+ "<h3>"
					+ "<a href='" + repo.html_url + "' target='_blank'>" + repo.name + "</a>"
					+ "</h3>"
					+ (repo.fork ? "<p class='fork_flag'>"
					             + "Forked from <a href='https://github.com/" + repo.parent.owner.login + "/" + repo.parent.name + "' target='_blank'>"
					             + repo.parent.owner.login + "/" + repo.parent.name
					             + "</a></p>" : "")
					+ "</span>"
					+ "<div class='repo_extras'>"
					+ "<ul class='quick_links'>"
					+ "<li><a href='" + repo.html_url + "/branches' target='_blank'>Branches</a></li>"
					+ "<li><a href='" + repo.html_url + "/commits/master' target='_blank'>Commits</a></li>"
					+ "<li><a href='" + repo.html_url + "/issues?sort=created&direction=desc&state=open' target='_blank'>Issues</a></li>"
					+ "<li><a href='" + repo.html_url + "/pulls' target='_blank'>Pull Requests</a></li>"
					+ "<li><a href='" + repo.html_url + "/tags' target='_blank'>Tags</a></li>"
					+ ((repo.owner.id == App.user.logged.id) ? "<li><a href='" + repo.html_url + "/admin' target='_blank'>Admin</a></li>" : "")
					+ "</ul>"
					+ "<a class='zip' href='" + repo.html_url + "/zipball/" + ((repo.master_branch == null) ? "master" : repo.master_branch) + "' target='_blank'>ZIP</a>"
					+ "<ul class='links'>"
					+ "<li rel='ssh' data='" + repo.ssh_url + "'>SSH</li>"
					+ "<li rel='http' data='https://" + App.user.context.login + "@" + repo.clone_url.split("https://")[1] + "'>HTTP</li>"
					+ (repo['private'] == false ? "<li rel='git' data='" + repo.git_url + "'>Git Read-Only</li>" : "")
					+ "<li rel='input'>"
					+ "<input type='text' value='" + repo.ssh_url + "' />"
					+ "</li>"
					+ "</ul>"
					+ "<img class='copy' src='../img/clipboard.png' />"
					+ "</div>"
					+ "<div class='repo_about'>"
					+ "<p class='description'>" + repo.description + "</p>"
					+ "<p class='updated'>"
					+ ((repo.pushed_at != null) ? "Last updated <time>" + jQuery.timeago(repo.pushed_at) + "</time>" : "Never updated")
					+ "</p>"
					+ "</div>"
					+ "</li>";				
			},
			
			/**
			 * List
			 * 
			 * @param repos Repos to create HTML list for.
			 * @return Repo list in HTML.
			 */
			list: function(repos) {
				var html = "<ul class='repo_list'>";
				for(var i in repos) {
					html += Repos.html.item(repos[i]);
				}
				html += "</ul>";
				return html;
			}
		},
		
		load: {
			
			/**
			 * Cache
			 * 
			 * @param context Context requesting load.
			 */
			cache: function(context) {
				var cache = Cache.load(context.id, Repos.name);
				
				if(cache != null) {
					Repos.display.list(context.id, cache.data);
				}
				
				if(!cache || cache.expired) {
					Repos.load.refresh(context);
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
								buffer = Repos.filter.recentlyPushed(buffer);
								getParents(buffer, 0);
							}
						});
				};
				
				function getOrgRepos(buffer, page, last) {
					jQuery.getJSON("https://api.github.com/orgs/" + context.login + "/repos", {access_token: token, page: page})
						.success(function(json) {
							if(json.length == 0 || (last != null && json[json.length - 1].id == last.id)) {
								buffer = Repos.filter.recentlyPushed(buffer);
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
									Socket.postMessage(Repos.name, "display", "append", [context.id, json]);
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
							Socket.postMessage(Repos.name, "display", "append", [context.id, buffer[index]]);
							getParents(buffer, ++index);
						}
					}
					else {
						Cache.save(context.id, Repos.name, buffer);
						Socket.postComplete();
					}
				};
			},
			
			/**
			 * Refresh
			 *
			 * @param context Context requesting refresh.
			 */
			refresh: function(context) {
				Socket.postMessage(Repos.name, "load", "github", [context, OAuth2.getToken()]);
			}
		}
	};
	
	Repos.init();
})();