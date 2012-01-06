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
}


// Load the Application.
function loadApplication() {
    $(".loading").fadeOut(400, function() {
    
        if(!localStorage['menu_selected']) {localStorage['selected'] = 'repositories';}
        $('menu li').bind('click', menuOnClickListener); 
        $("#context_switcher span").html('<img src="' + github.user.avatar_url + '" />' + github.user.login);                    
        $('menu li[data=' + localStorage['menu_selected'] + ']').addClass('selected');
        $("#application").fadeIn(400, function(){});   
        loadContent();     
    });
}


// Menu onClickListener.
function menuOnClickListener() {
    $('menu li[data=' + localStorage['menu_selected'] + ']').removeClass('selected');
    localStorage['menu_selected'] = $(this).attr('data');    
    $('menu li[data=' + localStorage['menu_selected'] + ']').addClass('selected');
    loadContent();
    $('#content').fadeOut(500, function(){});    
};


function loadContent() {
    github[localStorage['menu_selected']](test);
};


function test(data) {
    console.log(data);
}


// Here we go...
$(document).ready(function() {
    if(!(token = github.getAccessToken())) { showAuthorize(); }    
    else{ github.loadUser(validateToken); }
});	