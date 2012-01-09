// Application Globals
var github = new GitHub();

// Application Constants.
var FADE_SPEED = 300;

// Prompt user to authorize extension with GitHub.
function showAuthorizationScreen() {

    var popupAnimation = {width: "413px", height: "269px"};

    $('#popup-header').delay(500).fadeOut(200, function(){
        $('body').removeClass('loading').animate(popupAnimation, function(){
            $('#authorization').delay(750).fadeIn(FADE_SPEED);
            $('#authorization button').click(function(){github.oauth2.begin();});
        });
    });
};


// Validate users token.
function validateToken(user) {

    // If the user is valid load the application.
    if(user) {
        loadApplication();
    }
    
    // If the user is not valid then clear access tokens
    // and show the authorization screen.
    else {
        github.clearAccessToken();
        showAuthorizationScreen();
    }
};


// Load popup application.
function loadApplication() {
    
    // Configure context switcher.
    $('.context-switcher .context-menu-button').html('<img src="' + github.user.avatar_url + '" />' + github.user.login);
    
    // Set menu tab onClickListeners.
    $('#dashboard nav li').bind('click', dashboardMenuOnClickListener);
    
    // Set selected menu tab.
    var currentTab = localStorage['content'] ? localStorage['content'] : 'repositories';    
    $('#dashboard nav li[data=' + currentTab + ']').addClass('selected');
    
    $('body').removeClass('loading');
    $('#content').addClass('loading');
    $('#application').removeClass('hidden');
    
    loadContent();
};


// Dashboard Menu OnClickListener.
function dashboardMenuOnClickListener() {
    
    // Change selected menu tab.
    $('nav li[data=' + localStorage['content'] + ']').removeClass('selected');
    localStorage['content'] = $(this).attr('data');
    $('nav li[data=' + localStorage['content'] + ']').addClass('selected');
    
    loadContent();
};


// Set content section display to loading.
function displayContentLoading() {
    var contentSection = $('#content');
    
    contentSection.fadeOut(FADE_SPEED, function() {
        $('#content').html("").addClass('loading').fadeIn(FADE_SPEED).delay(FADE_SPEED);
    });
};


// Set content section to display content.
function displayContent(content) {
    var contentSection = $('#content');
    
    contentSection.fadeOut(FADE_SPEED, function(){
        contentSection.removeClass('loading').html(content).fadeIn(FADE_SPEED);
    });
};


// Load content.
function loadContent() {

    displayContentLoading();

    switch( localStorage['content'] ) {
        case 'repositories':
            github.api.getAsync('repos', 'user/repos', displayRepositories);
            break;
        case 'watched':
            github.api.getAsync('watched', 'user/watched', displayWatched);
            break;
        case 'following':
            github.api.getAsync('following', 'user/following', displayFollowing);
            break;
        case 'followers':
            github.api.getAsync('followers', 'user/followers', displayFollowers);
            break;
        default:
            break;
    }
};


// Display user repositories.
function displayRepositories() {
	
	var updated = '';
	var date = new Date();
	
	var html = '<ul class="repo-list">';
	
	for(var key in github.repos) {
	    html += '<li class="' + (github.repos[key].private ? 'private' : 'public') + '">';
	    html += '<ul class="repo-stats">';
	    html += '<li>' + github.repos[key].language + '</li>';
	    html += '<li><a href="' + github.repos[key].svn_url + '/watchers" target="_blank" class="watchers">' + github.repos[key].watchers + '</a></li>';
	    html += '<li><a href="' + github.repos[key].svn_url + '/network" target="_blank" class="forks">' + github.repos[key].forks + '</a></li>';
	    html += '</ul>';
	    html += '<h3><a href="' + github.repos[key].svn_url + '" target="_blank">' + github.repos[key].name + '</a></h3>';
	    html += '<div><p class="description">' + github.repos[key].description + '</p>';
	    html += '<p class="updated-at">Last updated ' + github.repos[key].updated_at + '</p></div>';	         
	    html += '</li>';
	}
	
	html += '</ul>';
	displayContent(html);
};


// Displays users watched repositories.
function displayWatched() {
    
    var html = '<ul class="repo-list">';
    
    for(var key in github.watched) {
        html += '<li class="' + (github.watched[key].private ? 'private' : 'public') + '">';
        html += '<ul class="repo-stats">';
        html += '<li>' + github.watched[key].language + '</li>';
        html += '<li><a href="' + github.watched[key].svn_url + '/watchers" target="_blank" class="watchers">' + github.watched[key].watchers + '</a></li>';
        html += '<li><a href="' + github.watched[key].svn_url + '/network" target="_blank" class="forks">' + github.watched[key].forks + '</a></li>';
        html += '</ul>';
        html += '<h3><a href="' + github.watched[key].svn_url + '" target="_blank">' + github.watched[key].name + '</a></h3>';
        html += '<div><p class="description">' + github.watched[key].description + '</p>';
        html += '<p class="updated-at">Last updated ' + github.watched[key].updated_at + '</p></div>';
        html += '</li>';
    }
    
    html += '</ul>';
    displayContent(html);
};


// Display followed users.
function displayFollowing() {
	
	var html = '<ul class="follow-list">';
	var contentSection = $('#content');
	
	for(var key in github.following) {
	    html += '<li>';
	    html += '<a href="https://github.com/' + github.following[key].login + '" target="_blank">';
	    html += '<img src="' + github.following[key].avatar_url + '" />';
	    html += '</a>';
	    html += '<a href="https://github.com/' + github.following[key].login + '" target="_blank">';
	    html += github.following[key].login;
	    html += '</a>';
	    
	    var name = github.api.getSync('users/' + github.following[key].login).name;
	    
	    html += name ? ' (' + name + ')' : "";
	    html += '</li>';	    
	}
	
	html += '</ul>';
    displayContent(html);
};


// Display users followers.
function displayFollowers() {

    var name = '';
	var html = '<ul class="follow-list">';
	var contentSection = $('#content');
	
	for(var key in github.followers) {
	    html += '<li>';
	    html += '<a href="https://github.com/' + github.followers[key].login + '" target="_blank">';
	    html += '<img src="' + github.followers[key].avatar_url + '" />';
	    html += '</a>';
	    html += '<a href="https://github.com/' + github.followers[key].login + '" target="_blank">';
	    html += github.followers[key].login;
	    html += '</a>';
	    
	    name = github.api.getSync('users/' + github.followers[key].login).name;
	    
	    html += name ? ' (' + name + ')' : "";
	    html += '</li>';	    
	}
	
	html += '</ul>';
	displayContent(html);
};


// Start Application.
$(document).ready(function() {
    
    // If an application access token exists get the user.
    if( (token = github.getAccessToken()) ) {
        github.api.getAsync('user', 'user', validateToken);
    }
    
    // If no application access token exists show the 
    // authorization screen.
    else {showAuthorizationScreen();}
});