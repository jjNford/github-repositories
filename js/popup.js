// Application Constants.
var FADE_SPEED = 300;
var CACHE_REPOS_TIME = 1000000;
var CACHE_WATCHED_TIME = 1000000;
var CACHE_FOLLOWING_TIME = 1000000;
var CACHE_FOLLOWERS_TIME = 1000000;

// GitHub Object.
var GitHub = function() {
				this.api_url = "https://api.github.com/";
				this.user    = undefined;
			};

// Application Globals
var oauth2 = new OAuth2();
var github = new GitHub();


	
// Delete data from application cache.
function cacheDelete(key) {
	cache = JSON.parse(localStorage['cache_' + github.user.login]);
	delete cache[key];
	localStorage['cache_' + github.user.login] = JSON.stringify(cache);
};

// Load data from application cache.
function cacheLoad(key) {
	return JSON.parse(localStorage['cache_' + github.user.login])[key];
};
	
// Save data to application cache.
function cacheSave(key, data) {
	cache = JSON.parse(localStorage['cache_' + github.user.login]);
	cache[key] = {"time" : new Date().getTime(), "data" : data};
	localStorage['cache_' + github.user.login] = JSON.stringify(cache);
};

// Create context menu.
function createContextMenu() {
	
	contextSwitcherButton = $('.context_switcher .context_switcher_button');
	contextSwitcherPanel  = $('.context_switcher .context_switcher_panel');
	contextSwitcherOverlay= $('.context_overlay');
	
	// Apply user data to context switcher.
    contextSwitcherButton.html('<img src="' + github.user.avatar_url + '" />' + github.user.login);
	
	// Create button press effect.
	contextSwitcherButton.on('mousedown', function() {
		contextSwitcherButton.addClass('context_switcher_button_mousedown');
	});
	contextSwitcherButton.on('mouseup', function() {
 		contextSwitcherButton.removeClass('context_switcher_button_mousedown');
	});
	
	// Show the context menu.
	function showContextMenu() {
		contextSwitcherButton.addClass('active');
		contextSwitcherPanel.show();
		contextSwitcherOverlay.show();
		contextSwitcherOverlay.on('click', closeContextMenu);
		$('.context_switcher .context_switcher_panel .close').on('click', closeContextMenu);
	};
	
	// Close the context menu.
	function closeContextMenu() {
		contextSwitcherButton.removeClass('active');
		contextSwitcherPanel.hide();
		contextSwitcherOverlay.hide();
		contextSwitcherOverlay.off();
		$('.context_switcher .context_switcher_panel .close').off();
	};
	
	// Create event for context switcher button.
	contextSwitcherButton.bind('click', showContextMenu);
};

// Create tooltips.
function createToolTips() {
	
	// Set tooltip margins & hover effects for user links.
	$('.user_links .tooltip h1').each(function(){ 
		$(this).css('margin-left', -$(this).width()/2-8);
	});		
	$('.user_links li').each(function(){
		var menuItem = $(this);
		var toolTips = $('.user_links .tooltip');
		menuItem.hover(function(){ 
			$('.' + menuItem.attr('class') + ' .tooltip').removeClass('invisible').hover(function(){ 
				toolTips.addClass('invisible')
			});}, 		
			function(){ toolTips.addClass('invisible'); }
		);
	});
};

// Dashboard Navigation OnClickListener.
function dashboardNavigationOnClickListener() {
    
    // Change selected menu tab.
    $('.application_nav li[data=' + localStorage['content'] + ']').removeClass('selected');
    localStorage['content'] = $(this).attr('data');
    $('.application_nav li[data=' + localStorage['content'] + ']').addClass('selected');
    
	// Load users content.
    loadContent();
};

// Set content section to display content.
function displayContent(content) {
    var contentSection = $('#content');
    
    contentSection.fadeOut(FADE_SPEED, function(){
        contentSection.removeClass('loading').html(content).fadeIn(FADE_SPEED);

		// User relative times.
		jQuery("time.timeago").timeago();
    });
};

// Set content section display to loading.
function displayContentLoading() {
    var contentSection = $('#content');
    
    contentSection.fadeOut(FADE_SPEED, function() {
        contentSection.html("").addClass('loading').fadeIn(FADE_SPEED).delay(FADE_SPEED);
    });
};

// Display following users.
function displayFollowing(following) {
	html = '<ul class="following_list">';
	
	for(var current in following) {
			
		user = following[current];
		
		html += '<li>';
		html += '<a href="https://github.com/' + user.login + '" target="_blank">';
		html += '<img src="' + user.avatar_url + '" /></a>';
		html += '<a href="https://github.com/' + user.login + '" target="_blank">';
		html += user.login + '</a>';
		
		if(user.name != undefined) { html += '<em> (' + user.name + ')</em>'; }
	
		html += '</li>';
	}
	
	html += '</ul>';

	// Display content.
	displayContent(html);
};

// Display followers users.
function displayFollowers(followers) {
	html = '<ul class="following_list">';
	
	for(var current in followers) {
			
		user = followers[current];
		
		html += '<li>';
		html += '<a href="https://github.com/' + user.login + '" target="_blank">';
		html += '<img src="' + user.avatar_url + '" /></a>';
		html += '<a href="https://github.com/' + user.login + '" target="_blank">';
		html += user.login + '</a>';
		
		if(user.name != undefined) { html += '<em> (' + user.name + ')</em>'; }
	
		html += '</li>';
	}
	
	html += '</ul>';

	// Display content.
	displayContent(html);
};

// Display users watched repositories.
function displayWatched(watched) {
	
	html = '<ul class="watched_list">';
	
	for(var current in watched) {
		
		repo = watched[current];
		
		html += '<li class="' + (repo.private ? 'private' : 'public') + '">';
		html += '<a href="' + repo.html_url + '" target="_blank">';
		html += '<span class="user">' + repo.owner.login + '</span>'; 
		html += '/';
		html += '<span class="repo">'+ repo.name + '</span>';
		html += '</a>';
		html += '</li>';
	}
	
	html += '</ul>';
	
	displayContent(html);
};

// Display users repositories.
function displayRepos(repos) {
				
	html = '<ul class="repo_list">';
	
	for(var current in repos) {
		
		repo = repos[current];
				
		html += '<li class="' + (repos.private ? 'private' : 'public') + (repo.fork ? ' fork' : '') + '">';
		html += '<ul class="repo_stats">';
		html += '<li>' + (repo.language ? repo.language : "") + '</li>';
		html += '<li class="watchers"><a href="' + repo.html_url + '/watchers" target="_blank">' + repo.watchers + '</a></li>';
		html += '<li class="forks"><a href="' + repo.html_url + '/network" target="_blank">' + repo.forks + '</a></li>';
		html += '</ul>';
		html += '<h3><a href="' + repo.html_url + '" target="_blank">' + repo.name + '</a></h3>';
	
		// If forked display parent information.
		if(repo.fork) { html += '<p class="fork_flag">Forked from <a href="https://github.com/' + repo.parent.login + '/' + repo.name 
		                     + '" target="_blank">' + repo.parent.login + '/' + repo.name + '</a></p>'}
		
		html += '<div>';
		html += '<p class="description">' + repo.description + '</p>';
		html += '<p class="updated">Last updated ';
		html += '<time class="timeago" datetime="' + repo.updated_at + '">' + repo.updated_at + '</time>';
		html += '</p>';
		html += '</div>';
		html += '</li>';
	}
	
	html += '</ul>';
	
	// Display content.
	displayContent(html);
};

// Load application.
function loadApplication() {
	
	// If application cache has not been created then do so.
	if(!localStorage['cache_' + github.user.login]) { 
		localStorage['cache_' + github.user.login] = "{}"; }

	createContextMenu();

    // Set onClickListeners.
    $('.application_nav li').bind('click', dashboardNavigationOnClickListener);
	$('.user_links .log_out').bind('click', logoutOnClickListener);
	$('.refresh').bind('click', refreshOnClickListener);

	// Display application.
    $('body').removeClass('loading');
    $('#content').addClass('loading');
    $('#application').fadeIn(FADE_SPEED);

	// Set selected navigation tab.
    if(!localStorage['content']) { localStorage['content'] = "repositories"; } 
    $('.application_nav li[data=' + localStorage['content'] + ']').addClass('selected');

	createToolTips();
    loadContent();
};

// Load content.
function loadContent() {

    displayContentLoading();

    switch( localStorage['content'] ) {
        case 'repositories':
			loadRepos();
            break;
        case 'watched':
			loadWatched();
            break;
        case 'following':
			loadFollowing();
            break;
        case 'followers':
			loadFollowers();
            break;
        default:
            break;
    }
};

// Determine if following should be loaded from cache or GitHub.
function loadFollowing() {
	
	cached = false;
			
	// Check for following in cache.
	if(following = cacheLoad("following")) {
		if( (new Date().getTime()) - following.time < CACHE_FOLLOWING_TIME) { cached = true; }}

	// If following is cached then display following.
	// Else load following from GitHub then display.
	if(cached) { displayFollowing(following.data); }
	else { loadFollowingFromGitHub(); }
};


// Load following of user from GitHub.
function loadFollowingFromGitHub(pageNumber, following) {
	
	// If a page number is not defined set to page 1.
	// Create following array to store followers.
	if(!pageNumber) { pageNumber = 1; }
	if(!following)  { following = []; }
	
	// Recursivly load following data from GitHub.
	// If data is being returned keep recursing.  
	// Else load users names, save data to cache and display following.
	$.getJSON(github.api_url + 'user/following?page=' + pageNumber, {access_token: oauth2.getAccessToken()})
		.success(function(json) {
			// If data is still being returned keep requesting for following.
			if(json.length > 0) {				
				following = following.concat(json);
				loadFollowingFromGitHub(++pageNumber, following);
			}
			// If data is not returned get following user's names,
			// cache the data and display following.
			else { 
				if(following.length == 0) { displayFollowing([]); }
				for(var current in following) {
					if(current < (following.length - 1)) {
						loadUsersName(current, following);
					}
					else {
						loadUsersName(current, following, function(following) {
							cacheSave("following", following);
							displayFollowing(following);
						});
					}
				}				
			}
		});
};

// Determine if followers should be loaded from cache or GitHub.
function loadFollowers() {

	cached = false;
			
	// Check for followers in cache.
	if(followers = cacheLoad("followers")) {
		if( (new Date().getTime()) - followers.time < CACHE_FOLLOWERS_TIME) { cached = true; }}

	// If followers is cached then display followers.
	// Else load followers from GitHub then display.
	if(cached) { displayFollowers(followers.data); }
	else { loadFollowersFromGitHub(); }
};

// Load followers for current user from GitHub.
function loadFollowersFromGitHub(pageNumber, followers) {
		
	// If a page number is not defined set to page 1.
	// Create followers array to store followers.
	if(!pageNumber) { pageNumber = 1; }
	if(!followers)  { followers = []; }
	
	// Recursivly load followers data from GitHub.
	// If data is being returned keep recursing.  
	// Else load users names, save data to cache and display followers.
	$.getJSON(github.api_url + 'user/followers?page=' + pageNumber, {access_token: oauth2.getAccessToken()})
		.success(function(json) {
			// If data is still being returned keep requesting for followers.
			if(json.length > 0) {			
				followers = followers.concat(json);
				loadFollowersFromGitHub(++pageNumber, followers);
			}
			// If data is not returned get followers user's names,
			// cache the data and display followers.
			else { 
				if(followers.length == 0) { displayFollowers([]); }
				for(var current in followers) {
					if(current < (followers.length - 1)) {
						loadUsersName(current, followers);
					}
					else {
						loadUsersName(current, followers, function(followers) {
							cacheSave("followers", followers);
							displayFollowers(followers);
						});
					}
				}				
			}
		});
};

// Load forked repositories parent information.
function loadForkedRepoParents(repos, index) {

	// If an index is not defined set it to 0.
	if(!index) { index = 0; }

	// While index is less than the amount of repositories
	// check if the index repository is forked and if so
	// request the repositories parent information to be saved.
	if(index < repos.length) {
		if(repos[index].fork) {
			$.getJSON(github.api_url + 'repos/' + github.user.login + '/' + repos[index].name, {access_token: oauth2.getAccessToken()})
				.success(function(json) {
					repos[index].parent = json.parent.owner;
					loadForkedRepoParents(repos, ++index);
				});
		}
		// If not a forked repository move to the next repository.
		else { loadForkedRepoParents(repos, ++index); }
	}	
	
	// If all repositories have been checked, cache them and display them.
	else {
		
		// Sort repo's by last updated.
		repos.sort(function(a, b) {
			a = new Date(a.updated_at).getTime();
			b = new Date(b.updated_at).getTime();
			if(a > b) return -1;
			if(a < b) return 1;
			return 0;
		});
		
		cacheSave("repositories", repos);
		displayRepos(repos);
	}
};

// Determine if user repositories should be loaded from cache or GitHub.
function loadRepos() {
	
	cached = false;
			
	// Check for repositories in cache.
	if(repos = cacheLoad("repositories")) {
		if( (new Date().getTime()) - repos.time < CACHE_REPOS_TIME) { cached = true; }}

	// If repositories are cached then display repositories.
	// Else load repositories from GitHub then display.
	if(cached) { displayRepos(repos.data); }
	else { loadReposFromGitHub(); }
};


// Load repositories for current user from GitHub.
function loadReposFromGitHub(pageNumber, repos) {
	
	// If a page number is not defined set to page 1.
	// Create repos array to store repositories.
	if(!pageNumber) { pageNumber = 1; }
	if(!repos)  { repos = []; }
	
	// Recursivly load repositories from GitHub.
	// If data is being returned keep recursing.  
	// Else save data to cache and display repositories.
	$.getJSON(github.api_url + 'user/repos?page=' + pageNumber, {access_token: oauth2.getAccessToken()})
		.success(function(json) {
			// If data is still being returned keep requesting.
			if(json.length > 0) {			
				repos = repos.concat(json);
				loadReposFromGitHub(++pageNumber, repos);
			}
			// When all repositories have been received:
			// Display nothing if there are no repositories or
			// Loaded forked repositories parent information.
			else { 
				if(repos.length == 0) { displayRepos([]); }
				loadForkedRepoParents(repos);
			}
		});
};

// Load user data.
function loadUser() {
	
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
	
	loadApplication();
};

// Get user's name from GitHub based on login name.
function loadUsersName(index, users, callback) {
	$.getJSON(github.api_url + 'users/' + users[index].login)
		.success(function(json) {
			users[index].name = json.name;
			if( callback ) { callback(users); }
		});
};

// Determine if users watched repositories should be loaded from cache or GitHub.
function loadWatched() {
	
	cached = false;
			
	// Check for watched repositories in cache.
	if(watched = cacheLoad("watched")) {
		if( (new Date().getTime()) - watched.time < CACHE_WATCHED_TIME) { cached = true; }}

	// If watched repositories are cached then display them.
	// Else load watched repositories from GitHub then display.
	if(cached) { displayWatched(watched.data); }
	else { loadWatchedFromGitHub(); }
};


// Load watched repositories from GitHub.
function loadWatchedFromGitHub(pageNumber, watched) {
	
	// If a page number is not defined set to page 1.
	// Create watched array to store watched repositories.
	if(!pageNumber) { pageNumber = 1; }
	if(!watched)  { watched = []; }
	
	// Recursivly load watched repositories from GitHub.
	// If data is being returned keep recursing.  
	// Else save data to cache and display watched repositories.
	$.getJSON(github.api_url + 'user/watched?page=' + pageNumber, {access_token: oauth2.getAccessToken()})
		.success(function(json) {
			// If data is still being returned keep requesting.
			if(json.length > 0) {		
				watched = watched.concat(json);
				loadWatchedFromGitHub(++pageNumber, watched);
			}
			// When all watched repositories have been received:
			// Display nothing if there are no repositories or
			// Filter out user owned repositories and display watched results.
			else { 
				if(watched.length == 0) { displayWatched([]); }
				for(var i = (watched.length - 1); i >= 0; i--) {
					if(watched[i].owner.login == github.user.login) {
						watched.splice(i, 1);
					}
				}			
				cacheSave("watched", watched);
				displayWatched(watched);
			}
		});
};

// Logout OnClickListener.
function logoutOnClickListener() {
	// Clear access token and cache.
	oauth2.clearAccessToken();
	localStorage.clear();
	
	// Close popup.
	self.close();
	
	// Close window when viewing from window.
	chrome.tabs.getCurrent(function(thisTab) { chrome.tabs.remove(thisTab.id, function(){}); });
};

// Refresh OnClickListener.
function refreshOnClickListener() {
	cacheDelete(localStorage['content']);
	loadContent();
};

// Prompt user to authorize extension with GitHub.
function showAuthorizationScreen() {

    var popupAnimation = {width: "413px", height: "269px"};

    $('.github_header').delay(500).fadeOut(200, function(){
        $('body').removeClass('loading').animate(popupAnimation, function(){
            $('#authorization').delay(750).fadeIn(FADE_SPEED);
            $('#authorization button').click( function(){
	 			oauth2.flow.begin();
			});
        });
    });
};

// Start Application.
$(document).ready(function() {
	loadUser();
});