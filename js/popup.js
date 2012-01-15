// Application Constants.
var FADE_SPEED = 300;
var CACHE_FOLLOWING_TIME = 1000000;


// GitHub Object Constructor.
var GitHub = function() {
	this.api_url = "https://api.github.com/";
	this.user    = undefined;
};

		
// Load data from cache.
function cacheLoad(key) {
	return JSON.parse(localStorage['cache_' + github.user.login])[key];
};

	
// Save data to cache.
function cacheSave(key, data) {
	cache = JSON.parse(localStorage['cache_' + github.user.login]);
	cache[key] = {"time" : new Date().getTime(), "data" : data};
	localStorage['cache_' + github.user.login] = JSON.stringify(cache);
};


// Application Globals
var cache  = undefined;
var oauth2 = new OAuth2();
var github = new GitHub();


// Create the user link tooltips.
function createToolTips() {
	// Set tooltip margins & hover effects.
	$('.tooltip h1').each(function(){ 
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
}


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


// Load popup application.
function loadApplication() {
	
	// Enable cache.
	if(!localStorage['cache_' + github.user.login]) { 
		localStorage['cache_' + github.user.login] = "{}"; }

    // Configure context switcher.
    $('.context_switcher .context').html('<img src="' + github.user.avatar_url + '" />' + github.user.login);
    
    // Set navigation tab onClickListeners.
    $('.application_nav li').bind('click', dashboardNavigationOnClickListener);

	// Set logout onClickListener.
	$('.user_links .log_out').bind('click', logoutOnClickListener);

	// Display application
    $('body').removeClass('loading');
    $('#content').addClass('loading');
    $('#application').fadeIn(FADE_SPEED);

	// Set selected navigation tab (must be after application is visible).
    if(!localStorage['content']) { localStorage['content'] = "repositories"; } 
    $('.application_nav li[data=' + localStorage['content'] + ']').addClass('selected');

	// Create the user link tooltips.
	createToolTips();
    
	// Load users content.
    loadContent();
};


// Load GitHub user.
function loadUser() {
	
    // If an application access token exists get the user.
    if(oauth2.getAccessToken()) {
		$.getJSON(github.api_url + 'user', {access_token: oauth2.getAccessToken()})
			.success(function(json, textStatus, jqXHR) {
				github.user = json;
				loadApplication();
			})
			.error(function(json){
				console.log(json);
				// Do nothing if there is no connection.
				if(json.readyState == 0 && json.status == 0) {}
				else {showAuthorizationScreen();}
			});
    }
    
    // If no application access token exists show the authorization screen.
    else { showAuthorizationScreen(); }	
};


function loadUsersName(index, users, callback) {
	$.getJSON(github.api_url + 'users/' + users[index].login)
		.success(function(json) {
			users[index].name = json.name;
			if( callback ) { callback(users); }
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


// Logout OnClickListener.
function logoutOnClickListener() {
	oauth2.clearAccessToken();
	localStorage.clear();
	
	// Close popup.
	self.close();
	
	// Close window when viewing from window.
	chrome.tabs.getCurrent(function(thisTab) { chrome.tabs.remove(thisTab.id, function(){}); });
}


// Load content.
function loadContent() {

    displayContentLoading();

    switch( localStorage['content'] ) {
        case 'repositories':
            break;
        case 'watched':
            break;
        case 'following':
			loadFollowing();
            break;
        case 'followers':
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

	// If following is cached then display following
	// Else load following from GitHub then display.
	if(cached) { displayFollowing(following.data); }
	else { loadFollowingFromGitHub(); }
}


// Load following for current user from GitHub.
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
				for(var current in following) {
					if(current < (following.length - 1)) {
						loadUsersName(current, following);
					}
					else {
						loadUsersName(current, following, function(following) {
							cacheSave('following', following);
							displayFollowing(following);
						});
					}
				}				
			}
		});
};


// Display following users.
function displayFollowing(following) {
	html = '<ul class="following_list">';
	
	for(var current in following) {
			
		user = following[current];
		
		html += '<li>';
		html += '<a href="https://github.com/' + user.login + '">';
		html += '<img src="' + user.avatar_url + '" /></a>';
		html += '<a href="https://github.com/' + user.login + '">';
		html += user.login + '</a>';
		
		if(user.name != undefined) { html += '<em> (' + user.name + ')</em>'; }
	
		html += '</li>';
	}
	
	html += '</ul>';

	// Display content.
	displayContent(html);
};


// Set content section display to loading.
function displayContentLoading() {
    var contentSection = $('#content');
    
    contentSection.fadeOut(FADE_SPEED, function() {
        contentSection.html("").addClass('loading').fadeIn(FADE_SPEED).delay(FADE_SPEED);
    });
};


// Set content section to display content.
function displayContent(content) {
    var contentSection = $('#content');
    
    contentSection.fadeOut(FADE_SPEED, function(){
        contentSection.removeClass('loading').html(content).fadeIn(FADE_SPEED);
    });
};


// Start Application.
$(document).ready(function() {
	loadUser();
});