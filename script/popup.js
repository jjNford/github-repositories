// Application Globals
var github = new GitHub();

// Application Constants.
var FADE_SPEED = 500;


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
    if(user) {loadApplication();}
    else {
        github.clearAccessToken();
        showAuthorizationScreen();
    }
};


// Load popup application.
function loadApplication() {
    
    // Configure context switcher.
    $('.context-switcher .context-menu-button').html('<img src="' + github.user.avatar_url + '" />' + github.user.login);
    $('.context-switcher .context-menu-button').click(function() {
        if($('.context-switcher .context-pane').is(':visible')) {
    	    $('.context-switcher .context-pane').hide();
    	}
    	else { $('.context-switcher .context-pane').show(); }
    });
    
    // Set menu tab onClickListeners.
    $('#dashboard menu li').bind('click', dashboardMenuOnClickListener);
    
    // Set selected menu tab.
    var currentTab = localStorage['content'] ? localStorage['content'] : 'repositories';    
    $('#dashboard menu li[data=' + currentTab + ']').addClass('selected');
    
    $('body').removeClass('loading');
    $('#content').addClass('loading');
    $('#application').removeClass('hidden');
    
    loadContent();
};


// Dashboard Menu OnClickListener.
function dashboardMenuOnClickListener() {
    
    // Change selected menu tab.
    $('menu li[data=' + localStorage['content'] + ']').removeClass('selected');
    localStorage['content'] = $(this).attr('data');
    $('menu li[data=' + localStorage['content'] + ']').addClass('selected');
    
    loadContent();
};


// Set content section display to loading.
function displayContentLoading() {
    var contentSection = $('#content');
    contentSection.fadeOut(FADE_SPEED, function() {
        $('#content').html("").addClass('loading').fadeIn(FADE_SPEED);
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
	console.log(github.repos);
};


// Displays users watched repositories.
function displayWatched() {
	console.log(github.watched);
};


// Display followed users.
function displayFollowing() {
	
	var html = '<ul class="following">';
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

	var html = '<ul class="following">';
	var contentSection = $('#content');
	
	for(var key in github.followers) {
	    html += '<li>';
	    html += '<a href="https://github.com/' + github.followers[key].login + '" target="_blank">';
	    html += '<img src="' + github.followers[key].avatar_url + '" />';
	    html += '</a>';
	    html += '<a href="https://github.com/' + github.followers[key].login + '" target="_blank">';
	    html += github.followers[key].login;
	    html += '</a>';
	    
	    var name = github.api.getSync('users/' + github.followers[key].login).name;
	    
	    html += name ? ' (' + name + ')' : "";
	    html += '</li>';	    
	}
	
	html += '</ul>';
	displayContent(html);
};


// Start Application.
$(document).ready(function() {
    if( (token = github.getAccessToken()) ) {github.api.getAsync('user', 'user', validateToken);}
    else {showAuthorizationScreen();}
});