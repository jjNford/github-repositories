var github = new GitHub();



// Prompt user to authorize extension with GitHub.
function showAuthorizationScreen() {

    var popupAnimation = {width: "413px", height: "269px"};

    $('#popup-header').delay(500).fadeOut(200, function(){
        $('body').removeClass('loading').animate(popupAnimation, function(){
            $('#authorization').delay(750).fadeIn(400);
            $('#authorization button').click(function(){github.oauth2.begin();});
        });
    });
}



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
}



// Dashboard Menu OnClickListener.
function dashboardMenuOnClickListener() {
    
    // Change selected menu tab.
    $('menu li[data=' + localStorage['content'] + ']').removeClass('selected');
    localStorage['content'] = $(this).attr('data');
    $('menu li[data=' + localStorage['content'] + ']').addClass('selected');
    
    // Set content to loading.
    $('#content').html();
    $('#content').addClass('loading');
    
    // Load the appropriate content.
    switch( localStorage['content'] ) {
        case 'repositories':
            github.load('repos', 'user/repos', displayRepositories);
            break;
        case 'watched':
            github.load('watched', 'user/watched', displayWatched);
            break;
        case 'following':
            github.load('following', 'user/following', displayFollowing);
            break;
        case 'followers':
            github.load('followers', 'user/followers', displayFollowers);
            break;
        default:
            break;
    }
}



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
	console.log(github.following);
};



// Display users followers.
function displayFollowers() {
	console.log(github.followers);
};



// Start Application.
$(document).ready(function() {
    if((token = github.getAccessToken())) {github.load('user', 'user', validateToken);}
    else {showAuthorizationScreen();}
});