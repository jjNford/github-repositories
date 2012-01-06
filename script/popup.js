// GitHub Interface
var github = new GitHub();


// Prompt the user to authorize the extension with GitHub.
function showAuthorize() {
	$("#authorize button").click( function(){ github.oauth2.begin(); });
	$("header").delay(500).fadeOut(500);
	$(".loading").delay(500).fadeOut(500, function() {
	    $("body").animate({width: "413px", height: "269px"}, function() {
	        $("#authorize").delay(750).fadeIn(500);
	    });
	});
};


// Validate users tokens.
function validateToken(user) {
    if(!user) {
        github.clearAccessToken();
        showAuthorize();
    }
    else { loadApplication(); }
};


// Load the Application.
function loadApplication() {
    $(".loading").fadeOut(400, function() {
    
		// Configure context switcher.
		$("#context_switcher .context-menu-button").html('<img src="' + github.user.avatar_url + '" />' + github.user.login);
	    $('#context_switcher .context-menu-button').click(function() {
	    	if($('#context_switcher .context-pane').is(':visible')) {
	    		$('#context_switcher .context-pane').hide();
			}
	    	else { $('#context_switcher .context-pane').show(); }
	    });

		// Get menu tabe and content.
        if(!localStorage['content']) { localStorage['selected'] = 'repositories'; }
        $('menu li').bind('click', menuOnClickListener);                  
        $('menu li[data=' + localStorage['content'] + ']').addClass('selected');
        $("#application").fadeIn(400, function(){});

		loadContent();
    });
};


// Menu onClickListener.
function menuOnClickListener() {
	
	// Change selected menu item.
    $('menu li[data=' + localStorage['content'] + ']').removeClass('selected');
    localStorage['content'] = $(this).attr('data');
    $('menu li[data=' + localStorage['content'] + ']').addClass('selected');
    $('#content').fadeOut(400, function(){});
	
	loadContent();
};


// Load application content.
function loadContent() {

	var content = localStorage['content'];
	
	var member = null;
	var api_uri = null;
	var callback = null;

	// Take appropriate action.
	switch(content) {	
		case 'repositories':
			member   = 'repos';
			api_uri  = 'user/repos';
			callback = displayRepositories;
			break;
			
		case 'watched':
			member   = 'watched';
			api_uri  = 'user/watched';
			callback = displayWatched;
			break;
			
		case 'following':
			member   = 'following';
			api_uri  = 'user/following';
			callback = displayFollowing;
			break;	
				
		case 'followers':
			member   = 'followers';
			api_uri  = 'user/followers';
			callback = displayFollowers;
			break;
			
		default:
			break;
	}
	
	github.load(member, api_uri, callback);	
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
	console.log(github.following);
};


// Display users followers.
function displayFollowers() {
	console.log(github.followers);
};


// Here we go...
$(document).ready(function() {
    if(!(token = github.getAccessToken())) { showAuthorize(); }    
    else{ github.load('user', 'user', validateToken); }
});	