// Application Globals
var github = new GitHub();

// Application Constants.
var FADE_SPEED = 300;

// Prompt user to authorize extension with GitHub.
function showAuthorizationScreen() {

    var popupAnimation = {width: "413px", height: "269px"};

    $('.github_header').delay(500).fadeOut(200, function(){
        $('body').removeClass('loading').animate(popupAnimation, function(){
            $('#authorization').delay(750).fadeIn(FADE_SPEED);
            $('#authorization button').click( function(){
	 			github.oauth2.begin();
			});
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
    $('.context_switcher .context').html('<img src="' + github.user.avatar_url + '" />' + github.user.login);
    
    // Set menu tab onClickListeners.
    $('.application_nav li').bind('click', dashboardMenuOnClickListener);

	// Set logout onClickListener.
	$('.user_links .log_out').bind('click', function() {
		delete localStorage['content'];
		github.clearAccessToken();
		self.close();
	});

	// Display application
    $('body').removeClass('loading');
    $('#content').addClass('loading');
    $('#application').removeClass('hidden');

	// Set selected menu tab (must be after application is visible).
    if(!localStorage['content']) { localStorage['content'] = "repositories"; } 
    $('.application_nav li[data=' + localStorage['content'] + ']').addClass('selected');
    
	// Set tooltip margins.
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
    
	// Load users content.
    loadContent();
};


// Dashboard Menu OnClickListener.
function dashboardMenuOnClickListener() {
    
    // Change selected menu tab.
    $('.application_nav li[data=' + localStorage['content'] + ']').removeClass('selected');
    localStorage['content'] = $(this).attr('data');
    $('.application_nav li[data=' + localStorage['content'] + ']').addClass('selected');
    
	// Load users content.
    loadContent();
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


// Display user repositories.
function displayRepositories() {
	console.log("display repos");
};


// Displays users watched repositories.
function displayWatched() {
	console.log("display watched");
};


// Display followed users.
function displayFollowing() {
	console.log("display following");
};


// Display users followers.
function displayFollowers() {
	console.log("display followers");
};


// Start Application.
$(document).ready(function() {
	
    // If an application access token exists get the user.
    if( (token = github.getAccessToken()) ) {
        github.api.getAsync('user', 'user', validateToken);
    }
    
    // If no application access token exists show the authorization screen.
    else { showAuthorizationScreen(); }
});