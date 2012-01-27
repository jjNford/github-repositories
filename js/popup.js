// Application Constants.
var ANIMATION_SPEED = 225;
var CACHE			= "cache.";
var CACHE_DEFAULT   = "on";
var CACHE_ON        = "on";
var CACHE_OFF       = "off";
var CACHE_PREF      = "caching";
var CACHE_TIME      = 900000;
var CONTENT         = "content";
var CONTEXT         = "context";
var FILTERS			= "filters";
var FOLLOWERS       = "followers";
var FOLLOWING       = "following";
var REPOS           = "repos";
var WATCHED         = "watched";

// GitHub Object.
var GitHub = function() {
				this.api_url = "https://api.github.com/";
				this.user    = {};
				this.orgs    = [];
				this.context = {};
			};

// Global Objects.
var mOAuth2 = new OAuth2();
var mGitHub = new GitHub();

// Global Variables.
var mCaching = undefined;
var mContent = undefined;

var mFilterRepos     = undefined;
var mFilterWatched   = undefined;
var mFilterFollowing = undefined;
var mFilterFollowers = undefined;



/**
 * Authenticate
 * 
 * Authenticate the users OAuth2 token.
 * 
 */
function authenticate() {
	
	// If an access token exists load the users data.
	if(mOAuth2.getAccessToken()) {
		$.getJSON(mGitHub.api_url + "user", {access_token: mOAuth2.getAccessToken()})

		    // If there is a successful response then check if a User Object was returned.
			// If a User Object was returned then save the it and load the user's organizations.
			.success( function(json) {
				if(json.type == "User") {
				    mGitHub.user = json;
				    $.getJSON(mGitHub.api_url + "user/orgs", {access_token: mOAuth2.getAccessToken()})
					    .success(function(json) {
						    mGitHub.orgs = json;

						    // User and organization are saved, load application.
						    bootstrap();
					    });
				}
			})

			// If an error was returned check the ready state and the status of the JSON.
			// If both are equal to 0 there is a connection error so the application can do no more.
			// If there is not a connection error then the authentication failed so prompt the user to authenticate.
			.error( function(json){
			    if(json.readyState == 0 && json.status == 0) {}
			    else showAuthorizationScreen();
		    });
	}
	
	// If no authorization exists then prompt the user to 
	// authorize the extension to access there personal data.
	else showAuthorizationScreen(); 
};



/**
 * Bootstrap
 * 
 * Load last application state, set up the applicaiton context,
 * create the appropriate element binders and then disaply the application.
 * 
 */
function bootstrap() {

    // Get the state of the exention the last time was used
    onCreate();

	// Update the application context.
	// * Right now the context is just an ID because the User Object is
	//   never stored in the localstorage.  Only the ID of the user is.
	loadContext(mGitHub.context);
	
	// Bind Context Switcher events.
	//  - On mouse down add the "down" class to the context switcher button.
	//  - On mouse up remove the class "down" from the context switcher button.
	//  - When clicked toggle the context menu.
	var contextButton = $('.context_switcher .context_switcher_button');
	contextButton.on('mousedown', function() { contextButton.addClass('down'); });
	contextButton.on('mouseup',   function() { contextButton.removeClass('down'); }); 
	contextButton.bind('click',   function() { toggleContextMenu(); });

	// Bind Context Panel and Context Overlay events.
	//  - Toggle the context menu when the button is clicked
	//  - Close the context menu when the "X" is clicked
	$('.context_overlay').on('click', toggleContextMenu);
	$('.context_switcher .context_switcher_panel .close').on('click', toggleContextMenu);
 
	// Bind Navigation events.
	//  - Remove selected class from old tab.
	//  - Add the selected class to the new tab.
	//  - Set selected reference for next extension use.
	//  - Load the selected content.
	$('.application_nav li').on('click', function() {
        $('.application_nav li[rel=' + mContent + ']').removeClass('selected');
	    var clickedElement = $(this);
	    clickedElement.addClass('selected');
	    setContent( clickedElement.attr('rel') );
	    loadContent();
	});
	
	// Bind Logout click event.
	//  - Clear all local storage.
	//  - Close the popup (if in a window close the window).
	$('.user_links .log_out').on('click', function() {
        localStorage.clear();
        self.close();
        chrome.tabs.getCurrent(function(thisTab) { chrome.tabs.remove(thisTab.id, function(){}); });
    });

    // Bind Refresh click event.
    //  - Delete the cache
    //  - Load the current content.
	$('.refresh').on('click', function() {
        cacheDelete( mGitHub.context.id, mContent );
	    loadContent();
	});
	
	// Build Extension Settings.
	//  - Set appropriate caching button.
	//  - Bind events to caching button.
	//  - Bind events to settings button.
	(function() {
	    var settingsPanel = $('#settings');
	    var cache_button  = $('#settings .caching .button');

	    // Set appropriate caching button.
	    //  - Create a caching preference if one does not exist.
	    //  - If caching if Off display the Off button.
	    //  - If caching is On display the On button.
	    if( !localStorage[CACHE_PREF] ) localStorage[CACHE_PREF] = CACHE_DEFAULT; 
	    if( localStorage[CACHE_PREF] == CACHE_ON) cache_button.removeClass('negative').addClass('positive').html("Caching On");
	    else cache_button.removeClass('positive').addClass('negative').html("Caching Off");

	    // Bind Cache Button click event.
	    //  - Remove and Add the correct classes and HTML.
	    //  - Change the local storage settings.
	    //  - Change the local script variable.
	    //  - If the cache is turned off then flush the cache.
	    cache_button.on('click', function() {
	         if(localStorage[CACHE_PREF] == CACHE_ON) {
                cache_button.removeClass('positive').addClass('negative').html("Caching Off");
                localStorage[CACHE_PREF] = CACHE_OFF;
                mCaching = CACHE_OFF;
                for(var i = localStorage.length - 1; i >= 0; i--) {
                    var key = localStorage.key(i);
                    if( new RegExp(CACHE).test(key) ) delete localStorage[key];
                }
            }
	        else {
	            cache_button.removeClass('negative').addClass('positive').html("Caching On");
	            localStorage[CACHE_PREF] = CACHE_ON;
	            mCaching = CACHE_ON;
	        }
	    });

	    // Bind Settings click event to hide and show settings menu.
	    $('.extension_settings').on('click', function() {

	        // If settings are not opened then update the setting icon,
	        // slide the settings menu down, and hide overflow scroll bar
	        // to the application content to prevent the scroll bar from
	        // flashing when a late async callback is returned.
	        if( !settingsPanel.is(':visible') ) {
	            $('.user_links .extension_settings .link').addClass("opened");
	            settingsPanel.slideDown(ANIMATION_SPEED * 3);
	            $('#content').css('overflow-y', 'hidden');
	        }

            // If the settings panel is opened then remove opened class from the settings icon,
            // slide the panel up and return scrolling overflow to the application content section.
	        else { 
	            $('.user_links .extension_settings .link').removeClass("opened");
	            settingsPanel.slideUp(ANIMATION_SPEED * 3); 
	            $('#content').css('overflow-y', 'auto');
	        }
	    });
    })();
	
    // Display the Application article of the extension.
	$('body').removeClass('loading');
	$('#application').fadeIn(ANIMATION_SPEED);
	
	// Render the User Link Tooltips.
	//  - Set the correct margin.
	//  - Set the hover effects.
	//
	// * This must be done after the the application is displayed because the width of the tooltips
	//   is generated dynamically to center their width.  Thats they are displayed.
    (function() {
	    $('.user_links .tooltip h1').each( function() { $(this).css('margin-left', -$(this).width()/2-8); });
	    $('.user_links li').each(function(){
	        var menuItem = $(this);
	        var toolTips = $('.user_links .tooltip');
	        menuItem.hover(
	            function() { $('.' + menuItem.attr('class') + ' .tooltip').css('visibility', 'visible').hover( function() { toolTips.css('visibility', 'hidden') }); },       
	            function() { toolTips.css('visibility', 'hidden'); }
	        );
	    });
    })();
};



/**
 * Cache Delete
 * 
 * Remove selected data from the cache.
 * 
 * @param contextID - Context ID of cache owner.
 * @param key - Hash key where data should be removed.
 * 
 */
function cacheDelete(contextID, key) {
	try {
		var cache = JSON.parse( localStorage[CACHE + contextID] );
		delete cache[key]
		localStorage[CACHE + contextID] = JSON.stringify(cache);
	}
	catch(ignored) {}
};



/**
 * Cache Load
 * 
 * Load selected data from the cache.
 * 
 * @param contextID - Context ID of cache owner.
 * @param key - Hash key data should be loaded from.
 * @return data - Data if found, false is not.
 * 
 */
function cacheLoad(contextID, key) {
    if( mCaching == CACHE_ON ) {
        try { 
            var data = JSON.parse( localStorage[CACHE + contextID] )[key]; 
            var time = new Date().getTime();
            if(time - data.time > CACHE_TIME) { return false; }
            return (data.cache ? data.cache : false);
        } 
        catch(error) { return false; }
    }
    return false;
};


 
/**
 * Cache Save
 * 
 * Save given data to the cache.
 * 
 * @param contextID - Context ID of cache owner.
 * @param key - Hash key data should be loaded from.
 * @param data - Data to be saved.
 * 
 */
function cacheSave(contextID, key, data) {
    if( mCaching == CACHE_ON ) {
        try {
            var cache = JSON.parse( localStorage[CACHE + contextID] );
            cache[key] = {"time" : new Date().getTime(), "cache" : data};
            localStorage[CACHE + contextID] = JSON.stringify(cache);
        } 
        catch(error) {
            localStorage[CACHE + contextID] = "{}";
            cacheSave(contextID, key, data);
        }
    }
};



/**
 * Create Filter HTML
 * 
 * Create the html to display filters.
 * 
 * @param filters - Filters to be created. (JSON NOTATION -> {"filter" : "Filter Display"})
 * @param selected - The selected filter.
 * @return html - Filter Box HTML.
 * 
 */
function createFilterHTML(filters, selected) {

    // Create filter list elements.
    var filterItems = "";
    for(var current in filters) {
        filterItems += "<li>"
                     + "<span rel='" + current + "' " + ((current == selected) ? "class='selected'" : "") + ">"
                     + filters[current]
                     + "</span>"
                     + "</li>";
    }

    return "<div class='filter'>"
         + "<input type='text' class='filter_search' />"
         + "<ul>"
         + filterItems
         + "</ul>"
         + "</div>";
};



/**
 * Display Content
 * 
 * @param contextID - Context ID that called for display.
 * @param type - Type of content to display.
 * @param content - Content to display.
 * @param callback - Callback to be run after content is rendered.
 * 
 * * The context ID and type protect the display from being updated with late asyn callbacks.
 *   By checking the context we guarentee that a late callback will not update the display 
 *   when the context is switched.  By checking the type we guarentee that the display
 *   will not update after a late callback when on a different navigation tab.
 * 
 */
function displayContent(context, type, content, callback) {
    var contentSection = $('#content');
    if(type == mContent && context.id == mGitHub.context.id) {
        contentSection.fadeOut(ANIMATION_SPEED, function() {
            contentSection.removeClass('loading').html(content).fadeIn(ANIMATION_SPEED);
            if(callback) { callback(); }
        });
    }
};



/**
 * Display Content Loading
 * 
 * Remove the current content from the content window and display the loading gif.
 * 
 */
function displayContentLoading() {
    $('#content').fadeOut(ANIMATION_SPEED, function() {
        $('#content').html("").addClass('loading').fadeIn(ANIMATION_SPEED).delay(ANIMATION_SPEED);
    });
};



/**
 * Display Following
 * 
 * @param type - Following or Followers
 * @param following - Group of users to display.
 * 
 */
function displayFollowing(context, type, following) {

    // Create HTML Filter:
    //  - Get selected filter based on type.
    //  - Filter the data.
    var filterSelected = window["mFilter" + type.charAt(0).toUpperCase() + type.slice(1)];
    following = filter(filterSelected, following);

    // Create HTML.
    var html = createFilterHTML( {"alphabetical_following":"Abc", "recently_followed":"Most Recent"} , filterSelected)
             + "<ul class='following_list'>";

    // Create following list item html.
    for(var current in following) {

        var userLogin = following[current].login;
        var userAvatar= following[current].avatar_url ? following[current].avatar_url : "undefined";
        var userName  = following[current].name ? ("<em> (" + following[current].name + ")</em>") : "";

        html += "<li>"
              + "<a href='https://github.com/" + userLogin + "' target='_blank'>"
              + "<img src='" + userAvatar + "' />"
              + "</a>"
              + "<a href='https://github.com/" + userLogin + "' target='_blank' class='filter_item'>"
              + userLogin
              + "</a>"
              + userName
              + "</li>";
    }
    html += "</ul>";

    // Create callback to be run after content is rendered.
    //  - Create filter on click listeners.
    function callback() {
        filterOnClickListener();
    };

    // Display the content.
    displayContent(context, type, html, callback);
};



/**
 * Display Repos
 * 
 * Display Users Repositories.
 * 
 * @param repos - User repositories to display.
 * 
 */
function displayRepos(context, repos) {

    // Filter repos.
    repos = filter(mFilterRepos, repos);

    // Create HTML.
    var html = createFilterHTML({"all_repositories":"All", "public":"Public", "private":"Private", "source":"Source", "forks":"Forks"}, mFilterRepos)
             + "<ul class='repo_list'>";

    for(var current in repos) {

        var public_private = repos[current]['private'] ? "private" : "public";
        var forked         = repos[current].fork ? " fork" : "";
        var language       = repos[current].language ? repos[current].language : "";
        var httpURL        = "https://" + mGitHub.context.login + "@" + repos[current].clone_url.split("https://")[1];
        var masterBranch   = (repos[current].master_branch == null) ? "master" : repos[current].master_branch;

        // If the repository is forked:
        //  - Create the current markup for it using repos[current].parent data.
        var forkHTML = "";
        if(repos[current].fork) {
            forkHTML += "<p class='fork_flag'>"
                      + "Forked from <a href='https://github.com/" + repos[current].parent.owner.login + "/" + repos[current].parent.name + "' target='_blank'>"
                      + repos[current].parent.owner.login + "/" + repos[current].parent.name
                      + "</a>"
                      + "</p>";
        }

        // Create Git Read Only HTML.
        var gitReadOnlyHTML = "";
        if(repos[current]['private'] == false) gitReadOnlyHTML += "<li rel='git' data='" + repos[current].git_url + "'>Git Read-Only</li>";

        // Create Displayed HTML.
        html += "<li class='" + public_private + forked + "'>"
              + "<ul class='repo_stats'>"
              + "<li>" + language + "</li>"
              + "<li class='watchers'>"
              + "<a href='" + repos[current].html_url + "/watchers' target='_blank'>" + repos[current].watchers + "</a>"
              + "</li>"
              + "<li class='forks'>"
              + "<a href='" + repos[current].html_url + "/network' target='_blank'>" + repos[current].forks + "</a>"
              + "</li>"
              + "</ul>"
              + "<span class='repo_id'>"
              + "<h3>"
              + "<a href='" + repos[current].html_url + "' target='_blank' class='filter_item'>" + repos[current].name + "</a>"
              + "</h3>"
              + forkHTML
              + "</span>"
              + "<div class='repo_clone'>"
              + "<a class='zip' href='" + repos[current].html_url + "/zipball/" + masterBranch + "' target='_blank'>ZIP</a>"
              + "<ul class='links'>"
              + "<li rel='ssh' data='" + repos[current].ssh_url + "'>SSH</li>"
              + "<li rel='http' data='" + httpURL + "'>HTTP</li>"
              + gitReadOnlyHTML
              + "<li rel='input'><input type='text' value='" + repos[current].ssh_url + "'/></li>"
              + "</ul>"
              + "</div>"
              + "<div class='repo_about'>"
              + "<p class='description'>" + repos[current].description + "</p>"
              + "<p class='updated'>Last updated "
              + "<time class='timeago' datetime='" + repos[current].updated_at + "'>" + repos[current].updated_at + "</time>"
              + "</p>"
              + "</div>"
              + "</li>";
        }
        html += "</ul>";

    // Create callback to be run after repos are rendered.
    //  - Run time ago to get relative times
    //  - Add filter on click listener.
    //  - Add click events to cloning buttons
    function callback() {

        jQuery("time.timeago").timeago();

        filterOnClickListener();

        // Add Click Events for cloning buttons.
        //  - Add mousedown, up, and leave events to the ZIP button.
        $('.repo_list .repo_about').each( function() {
            $(this).on('click', function() {

                // Set button down class on zip button clicks.
                $('.repo_list .repo_clone .zip').on('mousedown', function()  { $(this).addClass('down'); });
                $('.repo_list .repo_clone .zip').on('mouseleave', function() { $(this).removeClass('down'); });
                $('.repo_list .repo_clone .zip').on('mouseup', function()    { $(this).removeClass('down'); });

                // When the descript are is clicked slide the conting area down.
                var cloneCenter = $(this).parent().find('.repo_clone');
                cloneCenter.slideToggle(ANIMATION_SPEED);

                // For the input box:
                //  - When clicked select the text for copying.
                //  - When a button is clicked:
                //      - Change the input box to contain its link.
                //      - Select the text.
                //      - Copy the text to the clipboard.
                //      - Toast (notify) the user that the link has been copied.
                var inputBox = cloneCenter.children().find('input');

                // Select input on click.
                inputBox.on('click', function() { $(this).select(); });

                // Cloning Buttons.
                cloneCenter.find('li').each( function() {

                    // Don't add an onclick event for the input box.
                    if( $(this).attr("rel") != "input" ) {
                        $(this).on('click', function() {

                            // Remove the selected class from another element.
                            // Add the selected class to the clicked element.
                            // Add the selected elements links to the input box.
                            // Select the text in the input box for quick copy.
                            $(this).siblings().removeClass('selected');
                            $(this).addClass('selected');
                            inputBox.val( $(this).attr('data') );
                            inputBox.select();

                            // Copy the link.
                            document.execCommand("copy");

                            // Notify user that link has been copied.
                            $('.copied').fadeIn(ANIMATION_SPEED * 2, function() {
                                $(this).delay(ANIMATION_SPEED).fadeOut(ANIMATION_SPEED * 2);
                            });
                        })
                    }
                });
            });
        });
    };

    // Display the content.
    displayContent(context, REPOS, html, callback);
};



/**
 * Display Watched
 * 
 * Display the Users watched repositories.
 * 
 * @param repos - Repositories to be displayed.
 * 
 */
function displayWatched(context, repos) {

    // Filter the repositories.
    repos = filter(mFilterWatched, repos);

    // Create the content HTML.
    var html = createFilterHTML({"alphabetical_repos":"Abc", "last_updated":"Last Updated", "last_watched":"Last Watched"}, mFilterWatched)
             + "<ul class='watched_list'>";

    for(var current in repos) {

        var public_private = repos[current]['private'] ? "private" : "public";

        html += "<li class='" + public_private + "'>"
             + "<a href='" + repos[current].html_url + "' target='_blank' class='filter_item'>"
             + "<span class='user'>" + repos[current].owner.login + "</span>"
             + "/"
             + "<span class='repo'>" + repos[current].name + "</span>"
             + "</a>"
             + "</li>";
    }
    html += "</ul>";

    // Create callback to be run after repos is rendered.
    //  - Add filter on click listener.
    function callback() {
        filterOnClickListener();
    };

    // Display the content.
    displayContent(context, WATCHED, html, callback);
};



/**
 * Filter
 * 
 * Filter the current data based on the filter type.
 * * As of now filter settings apply accross all Contexts.
 * 
 * @param filter - Filter to be used.
 * @param data - Data to be filtered.
 * @return data - Filtered data.
 * 
 */
function filter(filter, data) { 

    switch(filter) {

        // Filter following alphebetically
        case "alphabetical_following":
            data = sortFollowingAlphabetically(data);
            break;

        // Filter repos alphebetically
        case "alphabetical_repos":
            data = sortReposAlphabetically(data);
            break;

        // Filter all but public repos.
        case "forks":
            data = filterForkedReposOnly(data);
            break;
 
        // Filter by last updated.
        case "last_updated":
            data = sortReposByLastUpdated(data);
            break;
 
        // Filter all but public repos.
        case "public":
            data = filterPublicReposOnly(data);
            break;

        // Filter out all but private repos.
        case "private":
            data = filterPrivateReposOnly(data);
            break;

        // Sort by most recently followed
        case "recently_followed":
            data = sortFollowingByMostRecent(data);
            break;

            // Filter all but public repos.
        case "source":
            data = filterSourceReposOnly(data);
            break;

        // Default case returns repos in current order.
        default:
            break;
    }
    return data;
};



/**
 * Filter Forked Repos Only
 * 
 * Filter out all repositories that are not forked.
 * 
 * @param repos - Repos to be filtered.
 * @return repos - Filtered repos.
 * 
 */
function filterForkedReposOnly(repos) {
    if(repos.length == 0) return repos;
    for(var i = (repos.length - 1); i >= 0; i--) {
        if(!repos[i].fork) {
            repos.splice(i, 1);
        }
    }
    return repos;
};



/**
 * Filter On Click Listener
 * 
 * Binds click events to displayed filters.
 * * Events must be bound after filters box is rendered.
 * 
 */
function filterOnClickListener() {

    // Bind click event.
    //  - When a filter is clicked set that filter.
    //  - Load the content.
    $('.filter li span').on('click', function() {
        setFilter( mContent, $(this).attr('rel') );
        loadContent();
    });

    // Bind Filter Input Box events.
    //  - If the filter search box has focus add class "active".
    //  - If it loses and is empty focus remove the class "active"
    filterInput = $('.filter_search');
    filterInput.focusin( function() {
        filterInput.addClass('active'); 
    });
    filterInput.focusout( function() {
        if( !filterInput.val()) {
            filterInput.removeClass('active');
        }
    });

    // Create instant search.
    filterInput.keyup(function() {
        var regExp = new RegExp($(this).val(), 'i');
        $('#content ul .filter_item').each( function() {
            if( $(this).html().match(regExp) ) {
                $(this).closest('li').show();
            }
            else {
                $(this).closest('li').hide();
            }
        });
    });
};



/**
 * Filter Private Repos Only
 * 
 * Filter out all repos that are not private.
 * 
 * @param repos - Repos to be filtered.
 * @return repos - Filtered repos.
 * 
 */
function filterPrivateReposOnly(repos) {
    if(repos.length == 0) return repos;
    for(var i = (repos.length - 1); i >= 0; i--) {
        if(!repos[i]['private']) {
            repos.splice(i, 1);
        }
    }
    return repos;
};



/**
 * Filter Public Repos Only
 * 
 * Filter out all repos that are not public.
 * 
 * @param repos - Repos to be filtered.
 * @return repos - Filtered repos.
 * 
 */
function filterPublicReposOnly(repos) {
    if(repos.length == 0) return repos;
    for(var i = (repos.length - 1); i >= 0; i--) {
        if(repos[i]['private']) {
            repos.splice(i, 1);
        }
    }
    return repos;
};



/**
 * Filter Source Repos Only
 * 
 * Filter out all repos that are not source.
 * 
 * @param repos - Repos to be filtered.
 * @return repos - Filtered repos.
 * 
 */
function filterSourceReposOnly(repos) {
    if(repos.length == 0) return repos;
    for(var i = (repos.length - 1); i >= 0; i--) {
        if(repos[i].fork) {
            repos.splice(i, 1);
        }
    }
    return repos;
};



/**
 * Filter User Repos Only
 * 
 * Filter out all repos that are not user created.
 * 
 * @param repos - Repos to be filtered.
 * @return repos - Filtered repos.
 * 
 */
function filterUserRepos(repos) {
    if(repos.length == 0) return repos;
    for(var i = (repos.length - 1); i>= 0; i--) {
        if(repos[i].owner.login == mGitHub.context.login) {
            repos.splice(i, 1);
        }
    }
    return repos;
};



/**
 * Load Content
 * 
 * Adapter function to load correct content.
 * 
 */
function loadContent() {

    displayContentLoading();

    // Get a context instance to act as a semaphore
    // when asyn calls return a callback to late to display.
    context = mGitHub.context;
 
    // Load appropriate data.
    switch( mContent) {
 
        // Load Context Repositories.
        case REPOS:
            loadRepos(context, REPOS);
            break;

        // Load Users Watched Repositories.
        case WATCHED:
            loadRepos(context, WATCHED);
            break;

        // Load Users Following.
        case FOLLOWING:
            loadFollowing(context, FOLLOWING);
            break;

        // Load Users Followers.
        case FOLLOWERS:
            loadFollowing(context, FOLLOWERS);
            break;

        // Load Extension Settings.
        case 'settings':
            loadSettings();
            break;

        // WTF...
        default:
            break;
    }
};



/**
 * Load Context
 * 
 * Load the requested context and environment.
 * 
 * @param context - ID of the context to load.
 */
function loadContext(contextID) {

    // Remove the selected class from the navigation menu.
    $('.application_nav li[rel=' + mContent + ']').removeClass('selected');
	
	// If the user has no organizations then the application state
	// will not change the the GitHub user is the corrent context.
	// If there are organizations then we need to set the context.
	if(mGitHub.orgs.length == 0) mGitHub.context = mGitHub.user;
    else findContext();

    // Now that the correct context is set:
    //  - Add the selected class to the selecte navigation tab.
    //  - The Context Switcher must be updated
    //  - The correct navigation tab must be selected
    //  - The content must be loaded.
    $('.application_nav li[rel=' + mContent + ']').addClass('selected');
    var contextSwitherHTML = '<img src="' + mGitHub.context.avatar_url + '" />' + '<span>' + mGitHub.context.login + '</span>';
	$('.context_switcher .context_switcher_button').html(contextSwitherHTML);
	loadContent();
	
	// The correct context must be identified by its ID and set as the current
	// context to be used so that the application can load data from the GitHub API correctly.
	function findContext() {
	
	    // First check the base case: Is the context the User ?
	    if(contextID == mGitHub.user.id) mGitHub.context = mGitHub.user;
	
	    // Given the context ID we must find the User object the belongs to it.
	    //
	    // GitHub returns an array of Organization Object to us that are not ordered
	    // by login name nor by ID.  Because there will never be a user with thousands
	    // of contexts there is no reason to copy the organization array (to save context
	    // switcher order the array will need to be copied), sort the array, then search it.
	    // Instead we will walk through the array until we find the Organization Object
	    // that is equal to our ID.
        else {
            for(var i = 0; i < mGitHub.orgs.length; i++) {
                if(contextID == mGitHub.orgs[i].id) {
                    mGitHub.context = mGitHub.orgs[i];
                    setContext(mGitHub.context.id);
                    break;
                }
            }
        }

        // Now that the correct context is obtained the context switcher
        // must be created.  The order of the contexts followes these rules:
        //  - If multiple context exist, the currently used context if first
        //  - The user context is always second on the list if not selected.
        //  - The remaining context are ordered according to how they were retreived. 
        var contextOrderArray = [];

       contextOrderArray.push(mGitHub.context);

       if(mGitHub.context.id != mGitHub.user.id) contextOrderArray.push(mGitHub.user);

       for(var current in mGitHub.orgs) {
           if(mGitHub.context.id != mGitHub.orgs[current].id) 
                contextOrderArray.push( mGitHub.orgs[current] );
       }

       var contextMenuHTML = "<ul>";
       for(var i = 0; i < contextOrderArray.length; i++) {
           contextMenuHTML += "<li rel='"  + contextOrderArray[i].id + "' class='" + ((i==0) ? "selected" : "") + "'>"
                            + "<img src='" + contextOrderArray[i].avatar_url + "' />"
                            + "<span>"
                            + contextOrderArray[i].login
                            + "</span>"
                            + "</li>"
       }
       contextMenuHTML += "</ul>";

       // Add the HTML and binding events to the context switcher.
       $('.context_switcher .context_switcher_panel .orgs').html(contextMenuHTML);
       $('.context_switcher_panel .orgs li').each( function() {
            $(this).on('click', function() {
                var newContextID = $(this).attr('rel');
                if(newContextID && newContextID != mGitHub.context.id) {
                    setContext(newContextID);
                    toggleContextMenu();
                    loadContext(newContextID); 
                }
            });
        });

        // If the selected context is an Organization hide the navigation tabs.
        // And set the current navigation tab to the repositories.
        if(mGitHub.context.type != "User") {
            setContent(REPOS);
            $('.application_nav li').each( function() {
                if( $(this).attr("rel") != REPOS ) {

                    // * Element be be hidden - If an organization is selected 
                    //   when the extension popup in instantiated the navigation
                    //   will be hidden. 
                    $(this).slideUp(ANIMATION_SPEED, function() { $(this).hide(); });
                }
            });
        }
        else $('.application_nav li').each( function() { $(this).slideDown(ANIMATION_SPEED); });
    }
};
 


/**
 * Load Following
 * 
 * Load users following/followers.
 * 
 * @param type - Following or Followers.
 * 
 */
function loadFollowing(context, type) {

    // Attempt to load following from cache.
    var following = cacheLoad(context.id, type);

    // If following are found then display them.
    // If they are not then load them from GitHub.
    if(following) displayFollowing(context, type, following);
    else loadFromGitHub([], 1);

    // Use recursion to load all following from GitHub.
    //  - If data is returned from GitHub keep recursing.
    //  - If data is not returned from GitHub:
    //      - And no data exists then cache and display following.
    //      - If following exists then load the "User Names" and display.
    function loadFromGitHub(following, pageNumber) {
        $.getJSON(mGitHub.api_url + 'user/' + type, {access_token: mOAuth2.getAccessToken(), page: pageNumber})
            .success( function(json) {

                // Data is returned:
                if(json.length > 0) loadFromGitHub(following.concat(json), ++pageNumber);

                // No data is returned:
                else {

                    if( following.length == 0) {
                        cacheSave(context.id, type, following);
                        displayFollowing(context, type, following);
                    }

                    // Data was returned.  Send out async task to retreive user names.
                    // Give the last async taks a callback to cache and display following.
                    for(var current in following) {
                        var callback = null;
                        if(current == following.length -1) {
                            callback = function(following) {
                                cacheSave(context.id, type, following);
                                displayFollowing(context, type, following);
                            }
                        }
                        else var callback = null;
                        loadUserName(following, current, callback);
                    }
                }
            });
    };
};



/**
 * Load Repos
 * 
 * Load the appropriate repositories.
 * 
 * @param type - Type of repositories to load.
 * 
 */
function loadRepos(context, type) {

    // Attempt to load the repos from the cache.
    var repos = cacheLoad(context.id, type);

    // If the repos are found then trigger callback.
    // If they are not found then load them from GitHub.
    //  - When loading from GitHub check if context is a User or Organization.
    if(repos) display(repos);
    else {
        if(mGitHub.context.type == "User") loadUserReposFromGitHub([], 1);
        else loadOrgReposFromGitHub([], 1, null);
    }

    // User recursion to load all of a Users repos from GitHub.
    //  - If data is being returned keep recursing.
    //  - If no data is returned call the callback function. (loadRepos.callback).
    function loadUserReposFromGitHub(repos, pageNumber) {
        $.getJSON(mGitHub.api_url + 'user/' + type, {access_token: mOAuth2.getAccessToken(), page: pageNumber})
            .success( function(json) {
                if(json.length > 0) loadUserReposFromGitHub(repos.concat(json), ++pageNumber);
                else callback(repos);
            });

    };

    // Use recursion to load all of an organizations repos from GitHub.
    // For some reason GitHub API v3 does not return an empty set if 
    // no repos exist on the page, thus to stop from infinite recurrsion
    // we must make sure the last repo from the last request is not equal to
    // the last repo of the current request.
    // A context is required so callback knows what cache to save to.

    // User recursion to load all of the selected organizations repos form GitHub.
    //  - If no data is returned then there are no organization repos, callback.
    //  - If data is returned check its last reposoitory agains the previous last
    //    repository to determine if we need to keep recursing.
    //
    // * As of API V3 (01.26.2012) GitHub for some reason does not return organization repositories
    //   the same way it does user repositories. GitHub will not returned empty JSON data and will cause
    //   infinite recursion.  To prevent this check the last returned repository with the last repository of
    //   the previously returned repositories.
    function loadOrgReposFromGitHub(repos, pageNumber, lastRepo) {
        $.getJSON(mGitHub.api_url + 'orgs/' + context.login + '/repos', {access_token: mOAuth2.getAccessToken(), page: pageNumber} )
            .success( function(json) {

                // Make sure repos exist.
                // Check last repository with previouse last repository.
                // If repos exsist and the last repositories are not equal keep recursing.
                if(json.length == 0) callback(repos);
                else if(repos.length > 0 && json[json.length - 1].clone_url == lastRepo.clone_url) callback(repos);
                else {
                    repos = repos.concat(json);
                    loadOrgReposFromGitHub(repos, ++pageNumber, repos[repos.length - 1]);
                }
        });
    };

    // Callback Function.
    //  - User and Organization repositories need to retrieve their forked parent information
    //    before being sorted by last updated first, cached, and displayed.
    //  - Watched repositories need to filtered so User repositories do not show up in them
    //    before being cached and displayed.
    function callback(repos) {

        switch(type) {

            // User and Organization Repositories.
            case REPOS:

                // Get the parents of the forked repositories.
                // Request the repository information to get the parent data.
                // The repositoies must be retrieved synchrnously (in order) because
                // it is not known if the last one will be forked and causes an issue with
                // the callback and the other synchrounouse data.
                //
                // * In the future all the repository data could be pulled just like it is with following.
                //
                // * It could be done in a way that a counter would make sure it had accounted for
                //   all parent request before moving forward.  This can be added later if need be.
                function getRepoData(repos, index, callback) {
                    if(index < repos.length) {

                        // If repo is forked swap it out with its detailed information.
                        //  - If the request is successful swap the current repository with the more detailed one.
                        //  - An error from the request needs to also be caught.  This happens when
                        //    the name of a forked organization repository is changed and the organization context is 
                        //    trying to load its repositories (404 Error)
                        //  - If the repository is not a fork then recurse.
                        //
                        // If the AJAX call fails it's because the user/repo did not exists.  In this case
                        // just try to pull the data using the repos owner.login and name.
                        //
                        if(repos[index].fork) {
                            $.getJSON(mGitHub.api_url + 'repos/' + context.login + '/' + repos[index].name, {access_token: mOAuth2.getAccessToken()})
                                .success( function(json) {
                                    repos[index] = json;
                                    getRepoData(repos, ++index, callback);
                                })
                                .error( function(json) {
                                    $.getJSON(mGitHub.api_url + 'repos/' + repos[index].owner.login + '/' + repos[index].name, {access_token: mOAuth2.getAccessToken()})
                                        .success( function(json) {
                                           repos[index] = json;
                                           getRepoData(repos, ++index, callback); 
                                        });
                                });
                        }
                        else getRepoData(repos, ++index, callback);
                    }
                    else callback(repos);
                };

                // Get forked repos parents.  After all parents retrieved sort
                // repositories by last updated, save them to cache, then display them.
                // After all fork repository information has been obtained:
                //  - Sort the repositories by last updated.
                //  - Save the repositories to the cache.
                //  - Display the repositories.
                getRepoData(repos, 0, function(repos) {
                    repos = sortReposByLastUpdated(repos);
                    cacheSave(context.id, REPOS, repos);
                    display(repos);
                });
                break;

            // Watched Repositories.
            case WATCHED:
                repos = filterUserRepos(repos);
                cacheSave(context.id, WATCHED, repos);
                display(repos);
                break;

            // W hat.......
            // T errible...
            // F ailure....
            default:
                break;
        }
    };

    // Adapter function used to display repositories based on type.
    //  - User & Organization repositories
    //  - Watched repositories
    function display(repos) {
        switch(type) {
            case REPOS :
                displayRepos(context, repos);
                break;
            case WATCHED : 
                displayWatched(context, repos);
                break;
            default: 
                break;
        }
    };
};



/**
 * Load User Name
 * 
 * Load a user name into a group based on a login. 
 * (Saved to user object - group[index].name).
 * 
 * @param group - Group to get user name from (Passed by reference).
 * @param index - Index of user in group.
 * @param callback - Callback when complete.
 * 
 */
function loadUserName(group, index, callback) {
    $.getJSON(mGitHub.api_url + 'users/' + group[index].login)
        .success( function(json) {
            group[index].name = json.name;
            if(callback) callback(group);
        });
};



/**
 * On Resume
 * 
 * Load extension settings from last use.
 * 
 */
function onCreate() {

    // Create local storage entries.
    if( localStorage[CACHE_PREF] == undefined) { localStorage[CACHE_PREF] = CACHE_DEFAULT; }
    if( localStorage[CONTEXT]    == undefined) { localStorage[CONTEXT]    = mGitHub.user.id; } 
    if( localStorage[CONTENT]    == undefined) { localStorage[CONTENT]    = REPOS; }
    if( localStorage[FILTERS]    == undefined) { localStorage[FILTERS]    = "{}"; }

    // Load data from last extension use.
    mGitHub.context  = localStorage[CONTEXT]    ? localStorage[CONTEXT]    : mGitHub.user.id;
    mCaching         = localStorage[CACHE_PREF] ? localStorage[CACHE_PREF] : CACHE_OFF;
    mContent         = localStorage[CONTENT]    ? localStorage[CONTENT]    : REPOS;

    var filters      = JSON.parse( localStorage[FILTERS] );
    mFilterFollowers = filters[FOLLOWERS] ? filters[FOLLOWERS] : "recently_followed";
    mFilterFollowing = filters[FOLLOWING] ? filters[FOLLOWING] : "recently_followed";
    mFilterRepos     = filters[REPOS]     ? filters[REPOS]     : "all_repositories";
    mFilterWatched   = filters[WATCHED]   ? filters[WATCHED]   : "last_watched";
};



/**
 * Set current content.
 * 
 * Set the current content in local storage and global variable.
 * 
 * @param content - The content to be set.
 * 
 */
function setContent(content) {
    localStorage[CONTENT] = content;
    mContent = content;
};



/**
 * Set Context
 * 
 * Save the given context to local storage for next extension popup instance.
 * 
 * @param context - Context to be use next time extension is used.
 * 
 */
function setContext(context) {
	localStorage[CONTEXT] = context;
};
 
 
 
/**
 * Set Filter
 * 
 * Set a search filter.
 * 
 * @param key - Key of filter to set.
 * @param filter - The filter to set.
 */
function setFilter(key, filter) {

    // Save the filter to local storage for next extension use.
    var filters = JSON.parse( localStorage[FILTERS] );
    filters[key] = filter;
    localStorage[FILTERS] = JSON.stringify( filters );

    // Save instance data.
    window["mFilter" + key.charAt(0).toUpperCase() + key.slice(1)] = filter;
};
 
 
 
 /**
 * Show Authorization Screen
 * 
 * User was not authenticated and needs to authroize extension to
 * access to GitHub data.
 * 
 */
function showAuthorizationScreen() {
    $('.github_header').delay(500).fadeOut(200, function() {
        $('body').removeClass('loading').animate( {width: "413px", height: "269px"}, 
            function() {
                $('#authorization').delay(750).fadeIn(ANIMATION_SPEED);
                $('#authorization button').click( function() {
	 			    mOAuth2.flow.begin();
			    });
            });
        });
};



/**
 * Sort Following Alphabetically
 * 
 * Sort following and follower data alphabetically by login.
 * 
 * @param following - Users group to be sorted.
 * @return following - Sorted set.
 * 
 */
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



/**
 * Sort Following By Most Recent.
 * 
 * Following / Followers are given in order of first followed to last followed.
 * Reverse this list and return it.
 * 
 * @param following - Group of users to sort.
 * @return sorted - Sorted users.
 * 
 */
 function sortFollowingByMostRecent(following) {
     if(following && following.length > 0) {
         var sorted = [];
         for(var i = following.length - 1, j=0; i >= 0; i--, j++) {
             sorted[j] = following[i];
         }
         return sorted;
     }
     return following;
 }
 
 
 
/**
 * Sort Repos Alphabetically
 * 
 * Sort repos alphabetically by repo name.
 * 
 * @param repos - Repositories to be sorted.
 * @return repos - Sorted set.
 * 
 */
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



/**
 * Sort Repositories By Last Updated. 
 * 
 * @param repos - Repositories to be sorted.
 * @return repos - Sorted repositories.
 * 
 */
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



/**
 * Toggle Context Menu
 * 
 * Toggle the context menu and context menu overlay.
 * 
 */
function toggleContextMenu() { 
    if($('.context_switcher .context_switcher_panel').is(':visible')) {
        $('.context_switcher .context_switcher_button').removeClass('active');
        $('.context_switcher .context_switcher_panel').hide();
        $('.context_overlay').hide();
    }
    else {
        $('.context_switcher .context_switcher_button').addClass('active');
        $('.context_switcher .context_switcher_panel').show();
        $('.context_overlay').show();
    }
};



/**
 * On Document Ready
 * 
 * Start application with authentication.
 * 
 */
$(document).ready(function() {
    authenticate();
});