// MAKE SURE CONTEXT TRYING TO GET EXISTS OR JUST LOAD USER THEN

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
				this.orgs    = [];
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
					
					// User data obtained, now get user orgs.
					// On success save data, render context menu and load application.
					$.getJSON(github.api_url + 'user/orgs', {access_token: oauth2.getAccessToken()})
						.success(function(json) {
							github.orgs = json;
							loadApplication();
						});
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





// Update the extension to use the current context.
function updateContext(context) {
	
	var container = [];
	
	if(!context) { github.context = contextLoad(); }
	else { github.context = context; }
	
	// We need to update github.context to be the context user object
	// not just a string, giving us access to all context data.
	//
	// Check the basecase and make sure the logged user is not the context.
	if(github.user.login == github.context) {
		github.context = github.user;
	}
	
	// If the logged user is not the context, place all organization
	// context in a sorted array and run a binary search on 
	// it to find the context user object.
	//
	else {
		
		// To keep default order of github orgs we must copy
		// to the correct array to be sorted.
		for(var i = 0; i < github.orgs.length; i++) {
			container[i] = github.orgs[i];
		}
		
		// Sort orgs.
		container.sort( function(a, b) {
			a = a.login.toLowerCase();
			b = b.login.toLowerCase();
			if(a < b) return -1;
			if(a > b) return 1;
			return 0;
		});
		
		// Use a binary search to find the context user object.
		function binarySearch(orgs, low, high, key) {
			var mid = Math.floor( (low + high) / 2 );		
			if( low > high) return github.user;
			else if ( key == orgs[mid].login) return orgs[mid];
			else if ( key < orgs[mid].login) return binarySearch(orgs, low, mid-1, key);
			else return binarySearch(orgs, mid+1, high, key);
		};
	
		github.context = binarySearch(container, 0, container.length - 1, github.context);
	}
	 	
	// Set the context switcher avatar and name.
	$('.context_switcher .context_switcher_button').html('<img src="' + github.context.avatar_url + '" />' + '<span>' + github.context.login + '</span>');
		
	// Create a stack that holds the org and user contexts in order.
	// Push the current context onto the stack.
	// If the user is not the current context push the user onto the stack.
	// Then push the orgs given in order from GitHub onto the stack.
	container = [];
	container.push(github.context);
	
	// If the logged user is not the current context push context onto array.
	if(github.user.login != github.context.login) { container.push(github.user); }
	
	// Push ordered organization contexts onto array that are not the current context.
	for(var current in github.orgs) {
		if(github.context.login != github.orgs[current].login) {
			container.push( github.orgs[current] );
		}
	}

	// Create Context Menu Items.
	var html = "";
	for(var i = 0; i < container.length; i++) {
		html += '<li rel="' + container[i].login + '" class="' + ((i == 0) ? "selected" : "" ) + '">';
		html += '<img src="' + container[i].avatar_url + '" />';
		html += '<span>';
		html += container[i].login;
		html += '</span>';
		html += '</li>';
	}
	
	// Place contexts in context panel.
	$('.context_switcher .context_switcher_panel .orgs').html(html);
	
	// Set onclick for contexts.
	// Close panel.
	// Get context.
	// Update context.
	$('.context_switcher_panel .orgs li').each( function() {
		$(this).on('click', function() {
			
			var newContext = $(this).attr('rel');
			if(newContext && newContext != github.context.login) {
				contextSave(newContext);
				toggleContextMenu();
				updateContext(newContext); 
			}
		});
	});
};





// Delete data from cache.
function cacheDelete(key) {
	try {
		var cache = JSON.parse(localStorage.getItem(github.context.login + CACHE));
		delete cache[key]
		localStorage.setItem(github.context.login + CACHE, JSON.stringify(cache));
	}
	catch(error) {}
};





// Load data from cache.
function cacheLoad(key) {
	try { 
		var data = JSON.parse(localStorage.getItem(github.context.login + CACHE))[key]; 
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
			var cache = JSON.parse(localStorage.getItem(github.context.login + CACHE));
			cache[key] = {"time" : new Date().getTime(), "cache" : data};
			localStorage.setItem(github.context.login + CACHE, JSON.stringify(cache));
		}
	}
	
	// If cache does not exist create it and try again.
	catch(error) {
		localStorage.setItem(github.context.login + CACHE, "{}");
		cacheSave(key, data);
	}
};





// Load context from local storage.
function contextLoad() {	
	try {
		var context = localStorage['context'];
		if(context == undefined) throw "Undefined Context";
		return context;
	}
	
	// If loading a context fails set the context to 
	// the logged user and reload it.
	catch(error) {
		localStorage['context'] = github.user.login;
		return contextLoad();
	}
};





// Save the current context to local storage.
function contextSave(context) {
	localStorage['context'] = context;
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
function displayContent(type, content, callback) {
    var contentSection = $('#content');
    
	// Use type as a semaphore to stop asyn calls from being displayed out of turn.
	// Fade content, remove loading class, add html content and fade back in.
	// If a callback exists, use it.
	if(type == localStorage['content']) {
    	contentSection.fadeOut(ANIMATION_SPEED, function() {
        	contentSection.removeClass('loading').html(content).fadeIn(ANIMATION_SPEED);
			if(callback) { callback(); }
		});
	}
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
function displayFollowing(type, following) {

	// Set default filter.
	// Create filter box.
	// Filter following.
	if( !getFilter( localStorage['content'] )) { setFilter( localStorage['content'], "date"); }
	var html = createFilter({"alphabetical_following" : "Abc", "date" : "Date Followed"});
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
	displayContent(type, html, callback);
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
	displayContent("repos", html, callback);
};





// Display watched repositories.
function displayWatched(repos) {

	// Set default filter.
	// Create filter box.
	// Filter repos.
	if( !getFilter('watched')) { setFilter("watched", "last_watched"); }
	var html = createFilter({ "alphabetical_repos" : "Abc",
							  "last_updated" : "Last Updated",
							  "last_watched" : "Last Watched" 
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
	displayContent("watched", html, callback);
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
		if(repos[i].owner.login == github.context.login) {
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
			$.getJSON(github.api_url + 'repos/' + github.context.login + '/' + repos[index].name, {access_token: oauth2.getAccessToken()})
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

	// Set caching & content if not yet done.
	if( localStorage.getItem('caching') == undefined) { localStorage.setItem('caching', "on"); }	
	if(!localStorage['content']) {localStorage['content'] = "repos";}

	// Create context switcher.
	updateContext();
		
	// Bind context switcher events.
	contextButton = $('.context_switcher .context_switcher_button');		
	contextButton.on('mousedown', function() { contextButton.addClass('down'); });
	contextButton.on('mouseup', function() { contextButton.removeClass('down'); });	
	contextButton.bind('click', function() { toggleContextMenu(); });
	
	// Bind context panel and overlay events.
	$('.context_overlay').on('click', toggleContextMenu);
	$('.context_switcher .context_switcher_panel .close').on('click', toggleContextMenu);
	
	// Set and Bind Navigation.
	$('.application_nav li[data=' + localStorage['content'] + ']').addClass('selected');
	$('.application_nav li').on('click', function() {
	    $('.application_nav li[data=' + localStorage['content'] + ']').removeClass('selected');
		clickedElement = $(this);
	    localStorage['content'] = clickedElement.attr('data');
	    clickedElement.addClass('selected');
	    loadContent();
	});
	
	// Bind Logout.
	$('.user_links .log_out').on('click', function() {
		oauth2.clearAccessToken();
		localStorage.clear();
		self.close();
		chrome.tabs.getCurrent(function(thisTab) { chrome.tabs.remove(thisTab.id, function(){}); });
	});
	
	// Bind Refresh.
	$('.refresh').on('click', function() {
		cacheDelete(localStorage['content']);
		loadContent();
	});
	
	// Display Main Application.
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
	
	// Configure Settings.
	var settingsPanel = $('#settings');
	var cache_button  = $('#settings .caching .cache_button');
	
	// Get contribution repository.
	loadContributeRepo( function(repo) {
		var html = '<ul class="repo_list">';
		html += '<li class="public">';
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
		html += '<div>';
		html += '<p class="description">' + repo.description + '</p>';
		html += '<p class="updated">Last updated ';
		html += '<time class="timeago" datetime="' + repo.updated_at + '">' + repo.updated_at + '</time>';
		html += '</p>';
		html += '</div>';
		html += '</li>';
		html += '</ul>';
		
		$('#settings .contribute span').html(html);
		jQuery("time.timeago").timeago();
	});	

	// Set caching button.
	if(localStorage['caching'] == "on") { cache_button.removeClass('negative').addClass('positive').html("Caching On"); }
	else { cache_button.removeClass('positive').addClass('negative').html("Caching Off"); }
	
	// Bind caching button.
	cache_button.on('click', function() {
		// If caching is turned off delete cached data from local storage.
		if(localStorage['caching'] == "on") { 
			cache_button.removeClass('positive').addClass('negative').html("Caching Off");
			localStorage['caching'] = "off";		
					
			for(var i = localStorage.length - 1; i >= 0; i--) {
				var key = localStorage.key(i);
				if( new RegExp(CACHE).test(key)) {
					delete localStorage[key];
				}
			}
		}
		else {
			cache_button.removeClass('negative').addClass('positive').html("Caching On");
			localStorage['caching'] = "on";
		}
	});
	
	// Bind settings click event.
	$('.extension_settings').on('click', function() {
		if(!settingsPanel.is(':visible')) {
			$('.user_links .extension_settings .link').addClass("opened");
			settingsPanel.slideDown(ANIMATION_SPEED * 3);
			$('#content').css('overflow-y', 'hidden');
		}
		else { 
			$('.user_links .extension_settings .link').removeClass("opened");
			settingsPanel.slideUp(ANIMATION_SPEED * 3); 
			$('#content').css('overflow-y', 'auto');
		}
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





// Load contribution repository.
function loadContributeRepo(callback) {
	$.getJSON(github.api_url + 'repos/jjNford/github-repositories')
		.success( function(json) {
			callback(json);
		});
};





// Load followed users.
function loadFollowing(type) {
	 		
	// Check for following in cache.
	var following = cacheLoad(type);
	
	// If following is cached then display following.
	// If not load following from GitHub.
	if(following) { displayFollowing(type, following); }
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
						 							displayFollowing(type, completeData);
						 		};
						 	}
							
							// Get following user names.
							getUserName(following, current, callback);
						}
					}
					else { displayFollowing(type, following); }
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
	if(following && following.length > 0) {
		following.sort( function(a, b) {
			var a = a.login.toLowerCase();
			var b = b.login.toLowerCase();
			if(a > b) return 1;
			if(a < b) return -1;
			return 0;
		});
	}
	return following;
};





// Sort repos alphabetically.
function sortReposAlphabetically(repos) {
	if(repos && repos.length > 0) {
		repos.sort( function(a, b) {
			var a = a.name.toLowerCase();
			var b = b.name.toLowerCase();
			if(a > b) return 1;
			if(a < b) return -1;
			return 0;
		});
	}
	return repos;
};





// Sort repositories by last updated.
function sortReposByLastUpdated(repos) {
	if(repos && repos.length > 0) {
		repos.sort( function(a, b) {
			var a = new Date(a.updated_at).getTime();
			var b = new Date(b.updated_at).getTime();
			if(a > b) return -1;
			if(a < b) return 1;
			return 0;
		});
	}
	return repos;
};





// Toggle the context menu.
function toggleContextMenu() {	
	
	// If context menu is visible.
	// Remove active button class, hide panel, and hide overlay.
	if($('.context_switcher .context_switcher_panel').is(':visible')) {
		$('.context_switcher .context_switcher_button').removeClass('active');
		$('.context_switcher .context_switcher_panel').hide();
		$('.context_overlay').hide();
	}
	
	// If context menu is not visible.
	// Add active button class, show panel and show overlay.
	else {
		$('.context_switcher .context_switcher_button').addClass('active');
		$('.context_switcher .context_switcher_panel').show();
		$('.context_overlay').show();	
	}
};





// On Document Ready.
$(document).ready(function() {
	authenticate();
});