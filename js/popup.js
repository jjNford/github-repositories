// Application Constants.
var ANIMATION_SPEED = 225;
var CACHE_TIME      = 900000;
var CACHE			= "_cache";
var FILTERS			= "_filters";

// GitHub Object.
var GitHub = function() {
				this.api_url = "https://api.github.com/";
				this.user    = undefined;
				this.context = undefined;
			};

// Global Objects
var oauth2 = new OAuth2();
var github = new GitHub();





// Authenticate and load user.
function authenticate() {
	
	// If an application access token exists get the user.
	if(oauth2.getAccessToken()) {
			$.getJSON(github.api_url + 'user', {access_token: oauth2.getAccessToken()})
				.success(function(json, textStatus, jqXHR) {
					github.user = json;
					loadApplication();
				})
				
			// If there is an error the user is not authorized.
			// Show authorization screen.
			.error(function(json){
				// Do nothing if there is no connection.
				if(json.readyState == 0 && json.status == 0) {}
				else {showAuthorizationScreen();}
			});
		}
		    
	// If no application access token exists show the authorization screen.
	else { showAuthorizationScreen(); }			
};





// Delete data from cache.
function cacheDelete(key) {
	try {
		var cache = JSON.parse(localStorage.getItem(github.user.login + CACHE));
		delete cache[key]
		localStorage.setItem(github.user.login + CACHE, JSON.stringify(cache));
	}
	catch(error) {}
};





// Load data from cache.
function cacheLoad(key) {
	try { 
		var data = JSON.parse(localStorage.getItem(github.user.login + CACHE))[key]; 
		var time = new Date().getTime();
		
		// Make sure cache time has not expired.
		// Data does not need to be removed, it will be saved over.
		if(time - data.time > CACHE_TIME) {data = false;}
	} 
	catch(error) {data = false;}	
	return (data.cache ? data.cache : false);
};




	
// Save data to cache.
function cacheSave(key, data) {
	try {
		if(localStorage['caching'] == "on") {
			var cache = JSON.parse(localStorage.getItem(github.user.login + CACHE));
			cache[key] = {"time" : new Date().getTime(), "cache" : data};
			localStorage.setItem(github.user.login + CACHE, JSON.stringify(cache));
		}
	}
	
	// If cache does not exist create it and try again.
	catch(error) {
		localStorage.setItem(github.user.login + CACHE, "{}");
		cacheSave(key, data);
	}
};





// Create a filter for data.
function createFilter(filters) {
	
	var html;
	var selected = getFilter( localStorage.getItem('content') );
	
	html  = '<div class="filter">';
	html += '<input type="text" class="filter_search" />';
	html += '<ul>';
	
	for(var current in filters) {
		html += '<li>';	
		html += '<span rel="' + current + '" ' + ((current == selected) ? 'class="selected"' : '') + '>' + filters[current] + '</span>';
		html += '</li>';
	}
	
	html += '</ul>';
	html += '</div>';	
	return html;
};





// Create filter onclick to be set after filter is rendered.
function createFilterOnClick() {
	
	// Set current filter.
	$('.filter li span').on('click', function() {
		setFilter(localStorage.getItem('content'), $(this).attr('rel'));
		loadContent();
	});
	
	// Set filter background.
	filterInput = $('.filter_search');
	filterInput.focusin( function() {
		filterInput.addClass('active'); 
	});
	filterInput.focusout( function() {
		if( !filterInput.val()) {
			filterInput.removeClass('active');
		}
	});
		
	// Instant search.
	filterInput.keyup(function() {
		var regExp = new RegExp($(this).val(), 'i');
		$('#content ul .item').each( function() {
			if( $(this).html().match(regExp) ) {
				$(this).closest('li').show();
			}
			else {
				$(this).closest('li').hide();
			}
		});
	});
};





// Set content section to display content.
function displayContent(content, callback) {
    var contentSection = $('#content');
    
	// Fade content, remove loading class, add html content and fade back in.
	// If a callback exists, use it.
    contentSection.fadeOut(ANIMATION_SPEED, function(){
        contentSection.removeClass('loading').html(content).fadeIn(ANIMATION_SPEED);
		if(callback) {callback();}
    });
};





// Set content section display to loading.
function displayContentLoading() {
    var contentSection = $('#content');
    
	// Fade content, remove html, add loading class and fade back in.
    contentSection.fadeOut(ANIMATION_SPEED, function() {
        contentSection.html("").addClass('loading').fadeIn(ANIMATION_SPEED).delay(ANIMATION_SPEED);
    });
};





// Display following.
function displayFollowing(following) {

	// Set default filter.
	// Create filter box.
	// Filter following.
	if( !getFilter( localStorage['content'] )) { setFilter( localStorage['content'], "date"); }
	var html = createFilter({"date" : "Date Followed", "alphabetical_following" : "Abc"});
	following = filter(following);

	html += '<ul class="following_list">';
	
	for(var current in following) {
		user = following[current];
		
		html += '<li>';
		html += '<a href="https://github.com/' + user.login + '" target="_blank">';
		html += '<img src="' + user.avatar_url + '" />';
		html += '</a>';
		html += '<a href="https://github.com/' + user.login + '" target="_blank" class="item">' + user.login + '</a>';
		
		if(user.name != undefined) { html += '<em> (' + user.name + ')</em>'; }
		
		html += '</li>';
	}

	html += '</ul>';
	
	// Create callback to be run after content is rendered.
	function callback() {
		createFilterOnClick();
	};
	
	// Display content.
	displayContent(html, callback);
};





// Display User Repos.
function displayRepos(repos) {

	// Set default filter.
	// Create filter box.
	// Filter repos (already sorted by last updated).
	if( !getFilter( localStorage['content'] )) { setFilter( localStorage['content'], "all_repositories"); }
	var html = createFilter({ "all_repositories" : "All", 
	                          "public"           : "Public", 
							  "private"          : "Private", 
							  "source"           : "Source", 
							  "forks"            : "Forks" 
							});
	repos = filter(repos);

	html += '<ul class="repo_list">';

	for(var current in repos) {
		repo = repos[current];

		html += '<li class="' + (repos.private ? 'private' : 'public') + (repo.fork ? ' fork' : '') + '">';
		html += '<ul class="repo_stats">';
		html += '<li>' + (repo.language ? repo.language : "") + '</li>';
		html += '<li class="watchers">';
		html += '<a href="' + repo.html_url + '/watchers" target="_blank">' + repo.watchers + '</a>';
		html += '</li>';
		html += '<li class="forks">';
		html += '<a href="' + repo.html_url + '/network" target="_blank">' + repo.forks + '</a>';
		html += '</li>';
		html += '</ul>';
		html += '<h3>';
		html += '<a href="' + repo.html_url + '" target="_blank" class="item">' + repo.name + '</a>';
		html += '</h3>';

		// If forked display parent information.
		if(repo.fork) { 
			html += '<p class="fork_flag">';
			html += 'Forked from <a href="https://github.com/' + repo.parent.login + '/' + repo.name + '" target="_blank">' + repo.parent.login + '/' + repo.name + '</a>';
			html += '</p>';
		}

		html += '<div>';
		html += '<p class="description">' + repo.description + '</p>';
		html += '<p class="updated">Last updated ';
		html += '<time class="timeago" datetime="' + repo.updated_at + '">' + repo.updated_at + '</time>';
		html += '</p>';
		html += '</div>';
		html += '</li>';
	}

	html += '</ul>';

	// Create callback to be run after content is rendered.
	function callback() {
		jQuery("time.timeago").timeago();
		createFilterOnClick();
	};

	// Display content.
	// Have callback set relative times.
	displayContent(html, callback);
};





// Display watched repositories.
function displayWatched(repos) {

	// Set default filter.
	// Create filter box.
	// Filter repos.
	if( !getFilter('watched')) { setFilter("watched", "last_watched"); }
	var html = createFilter({ "last_watched" : "Last Watched", 
	 						  "last_updated" : "Last Updated", 
	                          "alphabetical_repos" : "Abc"
							});
	repos = filter(repos);

	// Create content.
	html += '<ul class="watched_list">';

	for(var current in repos) {

		repo = repos[current];

		html += '<li class="' + (repo.private ? 'private' : 'public') + '">';
		html += '<a href="' + repo.html_url + '" target="_blank" class="item">';
		html += '<span class="user">' + repo.owner.login + '</span>'; 
		html += '/';
		html += '<span class="repo">'+ repo.name + '</span>';
		html += '</a>';
		html += '</li>';
	}

	html += '</ul>';

	// Create callback to be run after content is rendered.
	function callback() {
		createFilterOnClick();
	};

	// Display content.
	displayContent(html, callback);
};





// Adapter to filter data.
function filter(data) {
	
	var filter = getFilter( localStorage.getItem('content') );

	switch(filter) {
		
		// Filter all but private repos.
		case "private":
			filterPrivateReposOnly(data);
			break;
			
		// Filter all but public repos.
		case "public":
			filterPublicReposOnly(data);
			break;
		
		// Filter all but public repos.
		case "source":
			filterSourceReposOnly(data);
			break;
				
		// Filter all but public repos.
		case "forks":
			filterForkedReposOnly(data);
			break;
		
		// Filter repos alphebetically
		case "alphabetical_repos":
			data = sortReposAlphabetically(data);
			break;
		
		// Filter following alphebetically
		case "alphabetical_following":
			data = sortFollowingAlphabetically(data);
			break;
		
		// Filter by last updated.
		case "last_updated":
			data = sortReposByLastUpdated(data);
			break;
		
		// Default case returns repos.
		default:
			break;
	}
	
	return data;
};





// Filter out all repos exept private.
function filterForkedReposOnly(repos) {
	if(repos.length == 0) return repos;

	for(var i = (repos.length - 1); i >= 0; i--) {
		if(!repos[i].fork) {
			repos.splice(i, 1);
		}
	}
	return repos;
};





// Filter out all repos exept private.
function filterPrivateReposOnly(repos) {
	if(repos.length == 0) return repos;

	for(var i = (repos.length - 1); i >= 0; i--) {
		if(!repos[i].private) {
			repos.splice(i, 1);
		}
	}
	return repos;
};





// Filter out all repos exept public.
function filterPublicReposOnly(repos) {
	if(repos.length == 0) return repos;
	
	for(var i = (repos.length - 1); i >= 0; i--) {
		if(repos[i].private) {
			repos.splice(i, 1);
		}
	}
	return repos;
};





// Filter out all repos exept private.
function filterSourceReposOnly(repos) {
	if(repos.length == 0) return repos;

	for(var i = (repos.length - 1); i >= 0; i--) {
		if(repos[i].fork) {
			repos.splice(i, 1);
		}
	}
	return repos;
};





// Filter out user repositories.
function filterUserRepos(repos) {
	if(repos.length == 0) return repos;
	
	for(var i = (repos.length - 1); i>= 0; i--) {
		if(repos[i].owner.login == github.user.login) {
			repos.splice(i, 1);
		}
	}
	return repos;
};





// Get a filter.
function getFilter(key) {
	try {
		var filter = JSON.parse(localStorage.getItem(github.user.login + FILTERS))[key];
	}
	catch(error) {filter = null;}
	return filter;
}





// Use recursion to load all forked repo parent information.
function getForkedRepoParents(repos, index, callback) {
	// While repositories exist check if they are forked. 
	// If so get their parent information.
	if(index < repos.length) {
		if(repos[index].fork) {
			$.getJSON(github.api_url + 'repos/' + github.user.login + '/' + repos[index].name, {access_token: oauth2.getAccessToken()})
				.success(function(json) {
					repos[index].parent = json.parent.owner;
					getForkedRepoParents(repos, ++index, callback);
				});
		}
		else { getForkedRepoParents(repos, ++index, callback); }
	}
	
	// If all repository parent information has been retrieved, callback.
	else { callback(repos); }
};





// Get user name from GitHub based on login.
function getUserName(following, index, callback) {
	$.getJSON(github.api_url + 'users/' + following[index].login)
 		.success( function(json) {
 			following[index].name = json.name;
 			if(callback) { callback(following); }
 		});
};





// Load application.
function loadApplication() {

	// Set caching if not yet done.
	if( localStorage.getItem('caching') == undefined) { localStorage.setItem('caching', "on"); }

	// Create context switcher.
	// 
	// Set context switcher image and context name.
	// Add mouse down and mouse up styleing to context switcher.
	// Set on click binding to context button.
	// 
	contextSwitcherButton = $('.context_switcher .context_switcher_button');
	contextSwitcherPanel  = $('.context_switcher .context_switcher_panel');
	contextSwitcherClose  = $('.context_switcher .context_switcher_panel .close');
	contextSwitcherOverlay= $('.context_overlay');
	
	contextSwitcherButton.html('<img src="' + github.user.avatar_url + '" />' + github.user.login);
	
	contextSwitcherButton.on('mousedown', function() {
		contextSwitcherButton.addClass('context_switcher_button_mousedown');
	});
	
	contextSwitcherButton.on('mouseup', function() {
 		contextSwitcherButton.removeClass('context_switcher_button_mousedown');
	});	
	
	contextSwitcherButton.bind('click', function() {	
		function closeContextMenu() {
			contextSwitcherButton.removeClass('active');
			contextSwitcherPanel.hide();
			contextSwitcherOverlay.hide();
			contextSwitcherOverlay.off();
			contextSwitcherClose.off();
		};
		
		contextSwitcherPanel.show();
		contextSwitcherOverlay.show();
		contextSwitcherButton.addClass('active');
		contextSwitcherOverlay.on('click', closeContextMenu);
		contextSwitcherClose.on('click', closeContextMenu);
	});	

	// Bind Navigation clicks.
	// Set selected navigation button to selected.
	//
	$('.application_nav li').on('click', function() {
	    $('.application_nav li[data=' + localStorage['content'] + ']').removeClass('selected');
		clickedElement = $(this);
	    localStorage['content'] = clickedElement.attr('data');
	    clickedElement.addClass('selected');
	    loadContent();
	});
	
	if(!localStorage['content']) {localStorage['content'] = "repos";}
	$('.application_nav li[data=' + localStorage['content'] + ']').addClass('selected');
		
	// Bind Logout click.
	$('.user_links .log_out').on('click', function() {
		oauth2.clearAccessToken();
		localStorage.clear();
		self.close();
		chrome.tabs.getCurrent(function(thisTab) { chrome.tabs.remove(thisTab.id, function(){}); });
	});
	
	// Bind Refresh click.
	$('.refresh').on('click', function() {
		cacheDelete(localStorage['content']);
		loadContent();
	});
	
	// Display GitHub Repositories.
    $('body').removeClass('loading');
    $('#content').addClass('loading');
    $('#application').fadeIn(ANIMATION_SPEED);

	// Fix User Link Tooltip margins.
	// Create User Link Tooltip hover effects.
	// Bind User Link clicks. 
	//
	$('.user_links .tooltip h1').each(function(){ 
		$(this).css('margin-left', -$(this).width()/2-8);
	});		
	
	$('.user_links li').each(function(){
		var menuItem = $(this);
		var toolTips = $('.user_links .tooltip');
		menuItem.hover(function(){ 
			$('.' + menuItem.attr('class') + ' .tooltip').css('visibility', 'visible').hover(function(){ 
				toolTips.css('visibility', 'hidden')
			});}, 		
			function(){ toolTips.css('visibility', 'hidden'); }
		);
	});
	
	// Bind Settings click.
	// Content overflow is hidden to remove scroll bar showing up.
	// Set caching button to caching settings.
	// Set caching button on click.
	//
	$('.extension_settings').on('click', function() {
		
		var settingsPanel = $('#settings');
		var cache_button  = $('#settings .caching .cache_button');
		
		if(!settingsPanel.is(':visible')) {
			settingsPanel.slideDown(ANIMATION_SPEED * 3);
			$('#content').css('overflow-y', 'hidden');
		}
		else { 
			settingsPanel.slideUp(ANIMATION_SPEED * 3); 
			$('#content').css('overflow-y', 'auto');
		}
		
		if(localStorage['caching'] == "on") { cache_button.removeClass('negative').addClass('positive').html("Caching On"); }
		else { cache_button.removeClass('positive').addClass('negative').html("Caching Off"); }
		
		cache_button.on('click', function() {
			if(localStorage['caching'] == "on") { 
				cache_button.removeClass('positive').addClass('negative').html("Caching Off");
				localStorage['caching'] = "off";		
						
				var regExp = new RegExp(CACHE);
				for(var i = 0; i < localStorage.length; i++) {
					var key = localStorage.key(i);
					if(key.match(regExp)) {
						delete localStorage[key];
					}
				}
			}
			else {
				cache_button.removeClass('negative').addClass('positive').html("Caching On");
				localStorage['caching'] = "on";
			}
		});
		
	});
	
	// Load content.	
    loadContent();
};





// Load content.
function loadContent() {

	// Remove content data and display loading class.
    displayContentLoading();

	// Determine data to load.
    switch( localStorage['content']) {
	
        case 'repos':
			loadRepos("repos");
            break;

        case 'watched':
			loadRepos("watched");
            break;

        case 'following':
			loadFollowing("following");
            break;

        case 'followers':
			loadFollowing("followers");
            break;

		case 'settings':
			loadSettings();
			break;
			
        default:
            break;
    }
};





// Load followed users.
function loadFollowing(type) {
	 		
	// Check for following in cache.
	var following = cacheLoad(type);
	
	// If following is cached then display following.
	// If not load following from GitHub.
	if(following) { displayFollowing(following); }
	else { loadFromGitHub([], 1); }
	
	// Use recursion to load all following from GitHub.
	function loadFromGitHub(following, pageNumber) {		
		$.getJSON(github.api_url + 'user/' + type + '?page=' + pageNumber, {access_token: oauth2.getAccessToken()})
			.success( function(json) {
				
				// If data is being returned keep recursing.
				if(json.length > 0) {
					following = following.concat(json);
					loadFromGitHub(following, ++pageNumber);
				}
				// If data is not returned get user names, cache data, and disply following.
				else {
					if(following.length > 0) {
						for(var current in following) {
							// Determin callback method for user name retrieval.
						 	if(current < (following.length - 1)) {callback = null;}
						 	else { 
								var callback = function(completeData) {
						 							cacheSave(type, completeData);
						 							displayFollowing(completeData);
						 		};
						 	}
							
							// Get following user names.
							getUserName(following, current, callback);
						}
					}
					else { displayFollowing(following); }
				}
			});
	};
};





// Load repos.
function loadRepos(type) {
				
	// Check for repos in cache.
	var repos = cacheLoad(type);
	
	// Create display function.
	var display = window["display" + type.charAt(0).toUpperCase() + type.slice(1)];
	
	// If repos are cached then display them.
	// If not load repos from GitHub.
	if(repos) { display(repos); }
	else { loadFromGitHub([], 1); }
	
	// Use recursion to load all repositories from GitHub.
	function loadFromGitHub(repos, pageNumber) {
		$.getJSON(github.api_url + 'user/' + type + '?page=' + pageNumber, {access_token: oauth2.getAccessToken()})
			.success(function(json) {
				
				// If data is being returned keep recursing.
				if(json.length > 0) {
					repos = repos.concat(json);
					loadFromGitHub(repos, ++pageNumber);
				}
				else {
					// Take action according to repo type.
					switch(type) {
						
						// User Repositories.
						// Put in order of last updated.
						// Get forked Repo parents for display.
						case 'repos' : 
							repos = sortReposByLastUpdated(repos);
							getForkedRepoParents(repos, 0, function(repos) {
								cacheSave("repos", repos);
								display(repos);
							});
							break;
							
						// Watched Repositories.
						// Filter out own repos.
						// Cache and display.
						case 'watched' : 
							repos = filterUserRepos(repos);
							cacheSave("watched", repos);
							displayWatched(repos);
							break;
						
						// WTF...
						default: 
							break;
					}
				}
			});
	};
};





// Set a filter.
function setFilter(key, filter) {
	try {
		var filters = JSON.parse(localStorage.getItem(github.user.login + FILTERS));
		filters[key] = filter;
		localStorage.setItem(github.user.login + FILTERS, JSON.stringify(filters));
	}
	
	// If cache does not exist create it and try again.
	catch(error) {
		localStorage.setItem(github.user.login + FILTERS, "{}");
		setFilter(key, filter);
	}
};





// Prompt user to authorize extension with GitHub.
function showAuthorizationScreen() {

    var popupAnimation = {width: "413px", height: "269px"};

    $('.github_header').delay(500).fadeOut(200, function(){
        $('body').removeClass('loading').animate(popupAnimation, function(){
            $('#authorization').delay(750).fadeIn(ANIMATION_SPEED);
            $('#authorization button').click( function(){
	 			oauth2.flow.begin();
			});
        });
    });
};





// Sort following alphabetically.
function sortFollowingAlphabetically(following) {
	following.sort( function(a, b) {
		var a = a.login.toLowerCase();
		var b = b.login.toLowerCase();
		if(a > b) return 1;
		if(a < b) return -1;
		return 0;
	});
	return following;
};





// Sort repos alphabetically.
function sortReposAlphabetically(repos) {
	repos.sort( function(a, b) {
		var a = a.name.toLowerCase();
		var b = b.name.toLowerCase();
		if(a > b) return 1;
		if(a < b) return -1;
		return 0;
	});
	return repos;
};





// Sort repositories by last updated.
function sortReposByLastUpdated(repos) {
	repos.sort( function(a, b) {
		var a = new Date(a.updated_at).getTime();
		var b = new Date(b.updated_at).getTime();
		if(a > b) return -1;
		if(a < b) return 1;
		return 0;
	});
	return repos;
};




// On Document Ready.
$(document).ready(function() {
	authenticate();
});