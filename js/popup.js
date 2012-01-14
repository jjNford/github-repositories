// Application Constants.
var FADE_SPEED = 300;


// GitHub Object.
var GitHub = function() {
	this.api_url = "https://api.github.com/";
};


// Application Globals
var oauth2 = new OAuth2();
var github = new GitHub();


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
    
    // Configure context switcher.
    $('.context_switcher .context').html('<img src="' + github.user.avatar_url + '" />' + github.user.login);
    
    // Set navigation tab onClickListeners.
    $('.application_nav li').bind('click', dashboardNavigationOnClickListener);

	// Set logout onClickListener.
	$('.user_links .log_out').bind('click', logoutOnClickListener);

	// Display application
    $('body').removeClass('loading');
    $('#content').addClass('loading');
    $('#application').removeClass('hidden');

	// Set selected navigation tab (must be after application is visible).
    if(!localStorage['content']) { localStorage['content'] = "repositories"; } 
    $('.application_nav li[data=' + localStorage['content'] + ']').addClass('selected');

	// Create the user link tooltips.
	createUserLinkToolTips();
    
	// Load users content.
    loadContent();
};


// Create the user link tooltips.
function createUserLinkToolTips() {
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


// Logout OnClickListener.
function logoutOnClickListener() {
	oauth2.clearAccessToken();
	localStorage.clear();
	
	// Close popup.
	self.close();
	
	// Close window when viewing from window.
	chrome.tabs.getCurrent(function(thisTab) { chrome.tabs.remove(thisTab.id, function(){}); });
}


// Dashboard Navigation OnClickListener.
function dashboardNavigationOnClickListener() {
    
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
            break;
        case 'watched':
            break;
        case 'following':
            break;
        case 'followers':
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


// Start Application.
$(document).ready(function() {
	loadUser();
});