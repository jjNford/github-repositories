// Application Constants.
var ANIMATION_SPEED = 225;
var CACHE			= "cache->";
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
mCaching = undefined;
mContent = undefined;

mFilterRepos     = undefined;
mFilterWatched   = undefined;
mFilterFollowing = undefined;
mFilterFollowers = undefined;

/**
 * Authenticate
 * 
 * Make sure current access token is valid.
 * If so load User object and User Orgs from GitHub.
 * 
 */
function authenticate() {
	
	// If an access token exists:
	if(mOAuth2.getAccessToken()) {

        // Load User object from GitHub.
		$.getJSON(mGitHub.api_url + "user", {access_token: mOAuth2.getAccessToken()})
			.success( function(json) {

				// Check that User object was returned.
				if(json.type == "User") {
				    mGitHub.user = json;

                    // Load Users organizations.
				    $.getJSON(mGitHub.api_url + "user/orgs", {access_token: mOAuth2.getAccessToken()})
					    .success(function(json) {
						    mGitHub.orgs = json;

						    // User and organization are saved, load application.
						    bootstrap();
					    });
				}
			})

			// If an error is returned:
			.error( function(json){

			    // If no readyState or status is returned there is no connection.
			    // Keep extension in current state.
			    if(json.readyState == 0 && json.status == 0) {}
 
			    // Else the User/extension is not authorized.
			    else {
			        showAuthorizationScreen();
			    }
		});
	}
	
	// If no access token exists:
	else { 
	    showAuthorizationScreen(); 
	}
};



/**
 * Bootstrap
 * 
 * User/extension have been authenticated.  Set up application resources, 
 * bind DOM events, load and set extension state and context.
 * 
 */
function bootstrap() {

    // Load last extension state from storage.
    onCreate();

	// Update application context.
	loadContext( mGitHub.context );
	
	// Bind Context Switcher events.
	var contextButton = $('.context_switcher .context_switcher_button');
	contextButton.on('mousedown', function() { contextButton.addClass('down'); });
	contextButton.on('mouseup',   function() { contextButton.removeClass('down'); }); 
	contextButton.bind('click',   function() { toggleContextMenu(); });

	// Bind Context Panel and Context Overlay events.
	$('.context_overlay').on('click', toggleContextMenu);
	$('.context_switcher .context_switcher_panel .close').on('click', toggleContextMenu);
 
	// Bind Navigation events.
	$('.application_nav li').on('click', function() {

	    // Remove and add selected class to appropriate tab.
	    var clickedElement = $(this);
	    $('.application_nav li[data=' + mContent + ']').removeClass('selected');
	    clickedElement.addClass('selected');
	
	    // Save select to local storage for next extension load and load content.
	    setContent( clickedElement.attr('data') );
	    loadContent();
	});
	
	// Bind Logout click event.
	$('.user_links .log_out').on('click', function() {
 
	    // Clear all local storage.
	    mOAuth2.clearAccessToken();
        localStorage.clear();

        // Close the popup - if the extension is being run in a window, close the window.
        self.close();
        chrome.tabs.getCurrent(function(thisTab) { chrome.tabs.remove(thisTab.id, function(){}); });
    });

    // Bind Refresh click event.
	$('.refresh').on('click', function() {
        cacheDelete( mGitHub.context.login, mContent );
	    loadContent();
	});
	
	// Build Extension Settings.
	(function() {
	    var settingsPanel = $('#settings');
	    var cache_button  = $('#settings .caching .cache_button');

        // Put contribution repository into settings.
        injectContributionRepoHTML( $('#settings .contribute span') );

	    // Set caching button.
	    if( !localStorage[CACHE_PREF] ) localStorage[CACHE_PREF] = CACHE_DEFAULT; 
	    if( localStorage[CACHE_PREF] == CACHE_ON) cache_button.removeClass('negative').addClass('positive').html("Caching On");
	    else cache_button.removeClass('positive').addClass('negative').html("Caching Off");

	    // Bind Cache Button click event.
	    cache_button.on('click', function() {

	        // If caching is turned off:
	         if(localStorage[CACHE_PREF] == CACHE_ON) {

	             // Remove positive class, add negative class, and update text.
	             // Change setting in storage.
                cache_button.removeClass('positive').addClass('negative').html("Caching Off");
                localStorage[CACHE_PREF] = CACHE_OFF;
                mCaching = CACHE_OFF;

                // Delete all cached data.
                for(var i = localStorage.length - 1; i >= 0; i--) {
                    var key = localStorage.key(i);
                    if( new RegExp(CACHE).test(key) ) delete localStorage[key];
                }
            }

            // If cache is turned on:
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
	
    // Now the Extension Application can be displayed.
    // Remove the popup loading class, add the loading class to teh content window.
    // Fade the application in.
	$('body').removeClass('loading');
	$('#application').fadeIn(ANIMATION_SPEED);
	
	// Display the User Link Tooptips (upper lefthad corner).
	// This function must be run after the application is displayed,
	// because the tooltip width is dynamic.  If the display is set to 
	// none the the centering will not be adjusted correctly.
    (function() {
	    $('.user_links .tooltip h1').each( function() { 
	        $(this).css('margin-left', -$(this).width()/2-8);
	    });

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
 * Remove data from cache based on context and key.
 * 
 * @param context - Context login name of cache owner where delete should take place.
 * @param key - Key to data the should be removed from cache.
 * 
 */
function cacheDelete(context, key) {
	try {
		var cache = JSON.parse( localStorage[CACHE + context] );
		delete cache[key]
		localStorage[CACHE + context] = JSON.stringify(cache);
	}
	catch(ignored) {}
};



/**
 * Cache Load
 * 
 * Load data from cache given the context and key.
 * 
 * @param context - Context login name of cache owner to be loaded.
 * @param key - Cache key data should be loaded from.
 * @return data - If data is found it will be returned, if data is not found
 *                or has expried, false will be returned.
 * 
 */
function cacheLoad(context, key) {
    if( mCaching == CACHE_ON ) {

       // If caching is on, attempt to load data from cache.
        try { 
            var data = JSON.parse( localStorage[CACHE + context] )[key]; 
            var time = new Date().getTime();

            // Check that cached data has not expired.
            if(time - data.time > CACHE_TIME) { return false; }
            return (data.cache ? data.cache : false);
        } 

        // If an error is caught the cached data does not exist.
        catch(error) {return false;}
    }

    // If we made it here, cache cannot be loaded, return false.
    return false;
};


 
/**
 * Cache Save
 * 
 * Save data to cache given the context, key, and data.
 * 
 * @param context - Context login name of cache owner to save under.
 * @param key - Cache key to save to.
 * @param data - Data to be saved to cache.
 * 
 */
function cacheSave(context, key, data) {
    if( mCaching == CACHE_ON ) {

        // If caching is on attempt to save to it.
        try {
            var cache = JSON.parse( localStorage[CACHE + context] );
            cache[key] = {"time" : new Date().getTime(), "cache" : data};
            localStorage[CACHE + context] = JSON.stringify(cache);
        }
 
        // If cache does not exist create it and try again.
        catch(error) {
            localStorage[CACHE + context] = "{}";
            cacheSave(context, key, data);
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

    var html = '<div class="filter">'
             + '<input type="text" class="filter_search" />'
             + '<ul>';

    for(var current in filters) {
        html += '<li>'
              + '<span rel="' + current + '" ' + ((current == selected) ? 'class="selected"' : '') + '>' 
              + filters[current] 
              + '</span>'
              + '</li>';
    }

    html += '</ul>'
          + '</div>';

    return html;
};



/**
 * Display Content
 * 
 * @param user - Current user (acts as a semaphore for late async callbacks after switching context).
 * @param type - Type of content to display (acts as a semaphore for last sync callbacks when chaning content).
 * @param content - Content to display.
 * @param callback - Callback to be run after content is rendered.
 * 
 */
function displayContent(user, type, content, callback) {

    var contentSection = $('#content');

    // Check semaphore locks.
    if(type == localStorage['content'] && user == mGitHub.context.login) {

        // If content is not locked, fade out loading and fade in content.
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
function displayFollowing(type, following) {

    // Get filter for type.
    var filterSelected = window["mFilter" + type.charAt(0).toUpperCase() + type.slice(1)];

    // Filter the repos.
    following = filter(filterSelected, following);

    // Create HTML for Repos.
    // Create a filter box for sorting Repos.
    var filters = {"alphabetical_following":"Abc", "recently_followed":"Most Recent"};
    var html = createFilterHTML(filters, filterSelected);

    html += '<ul class="following_list">';

    for(var current in following) {
        user = following[current];

        html += '<li>'
              + '<a href="https://github.com/' + user.login + '" target="_blank">'
              + '<img src="' + user.avatar_url + '" />'
              + '</a>'
              + '<a href="https://github.com/' + user.login + '" target="_blank" class="filter_item">' 
              + user.login 
              + '</a>';

        if(user.name != undefined) { html += '<em> (' + user.name + ')</em>'; }

        html += '</li>';
    }
    html += '</ul>';

    // Create callback to be run after repos is rendered.
    // Create filter on click events after the filters have been rendered.
    function callback() {
        filterOnClickListener();
    };

    // Display content.
    displayContent(mGitHub.context.login, type, html, callback);
};



/**
 * Display Repos
 * 
 * Display Full Repositories.
 * 
 * @param repos - User repositories to display.
 * 
 */
function displayRepos(repos) {

    // Filter the repos.
    repos = filter(mFilterRepos, repos);

    // Create HTML for Repos.
    // Create a filter box for sorting Repos.
    var filters = {"all_repositories":"All", "public":"Public", "private":"Private", "source":"Source", "forks":"Forks"};
    var html = createFilterHTML(filters, mFilterRepos); 

    html += '<ul class="repo_list">';

    for(var current in repos) {
        repo = repos[current];

        html += '<li class="' + (repos.private ? 'private' : 'public') + (repo.fork ? ' fork' : '') + '">'
              + '<ul class="repo_stats">'
              + '<li>' + (repo.language ? repo.language : "") + '</li>'
              + '<li class="watchers">'
              + '<a href="' + repo.html_url + '/watchers" target="_blank">' + repo.watchers + '</a>'
              + '</li>'
              + '<li class="forks">'
              + '<a href="' + repo.html_url + '/network" target="_blank">' + repo.forks + '</a>'
              + '</li>'
              + '</ul>'
              + '<h3>'
              + '<a href="' + repo.html_url + '" target="_blank" class="filter_item">' + repo.name + '</a>'
              + '</h3>';

        // If repo is forked display parent information.
        if(repo.fork) { 
            html += '<p class="fork_flag">'
                  + 'Forked from <a href="https://github.com/' + ((repo.parent != undefined) ? repo.parent.login : "") + '/' + repo.name + '" target="_blank">' 
                  + ((repo.parent != undefined) ? repo.parent.login : "") + '/' + repo.name 
                  + '</a>'
                  + '</p>';
        }

        html += '<div>'
              + '<p class="description">' + repo.description + '</p>'
              + '<p class="updated">Last updated '
              + '<time class="timeago" datetime="' + repo.updated_at + '">' + repo.updated_at + '</time>'
              + '</p>'
              + '</div>'
              + '</li>';
    }
    html += '</ul>';

    // Create callback to be run after repos is rendered.
    // Run TimeAgo to set all repository time to relevent time since last update.
    // Create filter on click events after the filters have been rendered.
    function callback() {
        jQuery("time.timeago").timeago();
        filterOnClickListener();
    };

    // Display content.
    displayContent(mGitHub.context.login, REPOS, html, callback);
};



/**
 * Display Watched
 * 
 * Display the Users watched repositories.
 * 
 * @param repos - Repositories to be displayed.
 * 
 */
function displayWatched(repos) {

    // Filter the repos.
    repos = filter(mFilterWatched, repos);

    // Create HTML for Repos.
    // Create a filter box for sorting Repos.
    var filters = {"alphabetical_repos":"Abc", "last_updated":"Last Updated", "last_watched":"Last Watched"};
    var html = createFilterHTML(filters, mFilterWatched);

    html += '<ul class="watched_list">';

    for(var current in repos) {
        repo = repos[current];

        html += '<li class="' + (repo.private ? 'private' : 'public') + '">'
              + '<a href="' + repo.html_url + '" target="_blank" class="filter_item">'
              + '<span class="user">' + repo.owner.login + '</span>'
              + '/'
              + '<span class="repo">'+ repo.name + '</span>'
              + '</a>'
              + '</li>';
    }
    html += '</ul>';

    // Create callback to be run after repos is rendered.
    // Create filter on click events after the filters have been rendered.
    function callback() {
        filterOnClickListener();
    };

    // Display content.
    displayContent(mGitHub.context.login, WATCHED, html, callback);
};



/**
 * Filter
 * 
 * Filter the current data based on the filter type.
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
 * Filter out all repos that are not forked.
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
 * Binds click events to displayed filters.  Must be run after rendering filters.
 * 
 */
function filterOnClickListener() {

    // Bind filter click event.
    // After a filter is clicked, set it and reload content.
    $('.filter li span').on('click', function() {
        setFilter( mContent, $(this).attr('rel') );
        loadContent( mContent );
    });

    // Set filter input focus events.
    // If filter input has focus:
    filterInput = $('.filter_search');
    filterInput.focusin( function() {
        filterInput.addClass('active'); 
    });

    // If filter input loses focus:
    filterInput.focusout( function() {
        if( !filterInput.val()) {
            filterInput.removeClass('active');
        }
    });

    // Create instant search filter for data.
    // On key up pattern match all available data in the content.
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
        if(!repos[i].private) {
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
        if(repos[i].private) {
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
 * Get Contribution Repo
 * 
 * Get the HTML required to display the github-repositories probject.
 * 
 * @param element - DOM element to inject source reposotory html into.
 * 
 */
function injectContributionRepoHTML(element) {
    $.getJSON(mGitHub.api_url + 'repos/jjNford/github-repositories')
        .success( function(repo) {

            // Repository information has been retreived, create html.
            var html = '<ul class="repo_list">'
                     + '<li class="public">'
                     + '<ul class="repo_stats">'
                     + '<li>' + (repo.language ? repo.language : "") + '</li>'
                     + '<li class="watchers">'
                     + '<a href="' + repo.html_url + '/watchers" target="_blank">' + repo.watchers + '</a>'
                     + '</li>'
                     + '<li class="forks">'
                     + '<a href="' + repo.html_url + '/network" target="_blank">' + repo.forks + '</a>'
                     + '</li>'
                     + '</ul>'
                     + '<h3>'
                     + '<a href="' + repo.html_url + '" target="_blank" class="filter_item">' + repo.name + '</a>'
                     + '</h3>'
                     + '<div>'
                     + '<p class="description">' + repo.description + '</p>'
                     + '<p class="updated">Last updated '
                     + '<time class="timeago" datetime="' + repo.updated_at + '">' + repo.updated_at + '</time>'
                     + '</p>'
                     + '</div>'
                     + '</li>'
                     + '</ul>';
 
            // Inject element and run TimeAgo to get reletive time since last update.
            element.html(html);
        	jQuery("time.timeago").timeago();
        });
};



/**
 * Load Content
 * 
 * Single entry function to load current content into application.
 * 
 */
function loadContent() {
 
    // Remove content data and display loading class.
    displayContentLoading();

    // Load appropriate data.
    switch( mContent) {
 
        // Load Context Repositories.
        case REPOS:
            loadRepos(REPOS);
            break;

        // Load Users Watched Repositories.
        case 'watched':
            loadRepos("watched");
            break;

        // Load Users Following.
        case 'following':
            loadFollowing("following");
            break;

        // Load Users Followers.
        case 'followers':
            loadFollowing("followers");
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
 * Load a context into the application.  This will change cache usage, navigation, and api loading.
 * 
 * @param context - Context to load.
 */
function loadContext(context) {

    displayContentLoading();

    // If the User has no organizations then the context panel
	// and navigation do not need to be updated.
	// The current context will be the User.
	if(mGitHub.orgs.length == 0) { 
	    mGitHub.context = mGitHub.user; 
	} 

	// If the user has organizations the context menu must be updated, 
	// the navigation menu must be updated, and the selected context
	// saved for next time the extension is opened up.
	else {

        // Given the context login name we must find the User object beloning to it.
        // To do this we will run a merge sort based on login name on the Users
        // organizations.  Then a binary search will be performed to get the User object
        // of the given context.  The soreted organizations will be copied into a
        // different array so we can keep the context menu order presented by GitHub.

        var theOtherArray = [];

        // First check the base case - Is the context the Logged User ?
        if( mGitHub.user.login == mGitHub.context ) {
            mGitHub.context = mGitHub.user;
        }

        // Not the base case...
        else {

            // Copy organization array to preserve context menu order.
            for( var i = 0; i < mGitHub.orgs.length; i++) theOtherArray[i] = mGitHub.orgs[i];

            // Sort the copied array.
            theOtherArray.sort( function(a, b) {
                a = a.login.toLowerCase();
                b = b.login.toLowerCase();
                if(a < b) return -1;
                if(a > b) return 1;
                return 0;
            });

            // Define the binary search.
            function userObjectBinarySearch(orgs, key, low, high) {
                var mid = Math.floor( (low + high) / 2 );
                if (low > high) return mGitHub.user;
                else if ( key == orgs[mid].login ) return orgs[mid];
                else if ( key < orgs[mid].login ) return userObjectBinarySearch(orgs, key, low, mid-1);
                else return userObjectBinarySearch(orgs, key, mid+1, high);
            };

            // Find the User Object for out context.
            mGitHub.context = userObjectBinarySearch(theOtherArray, context, 0, theOtherArray.length - 1);
        }

        // Now all the context must be ordered to display in the context menu panel.
        // If no other context exists, nothing is added to the panel (and we wouldn't get to this code).
        // If multiple context exists the currently used context is first,
        // followed by the context of the logged User, then by the remaining context
        // given in order by the GET from GitHub.

        // An array will be created to hold the context in the correct order for rendering.

        theOtherArray = []; 
        theOtherArray.push( mGitHub.context );

        // If the logged user is not the current context push it onto the array.
        if( mGitHub.user.login != mGitHub.context.login ) theOtherArray.push( mGitHub.user );

        // Push organization context in order from GitHub onto the array.  Excluse the current context.
        for(var current in mGitHub.orgs) {
            if(mGitHub.context.login != mGitHub.orgs[current].login) 
                theOtherArray.push( mGitHub.orgs[current] );
        }

        // Create the context menu html - the first entry is the current context.
        var html = "<ul>";
        for(var i = 0; i < theOtherArray.length; i++) {
            html += '<li rel="' + theOtherArray[i].login + '" class="' + ((i == 0) ? "selected" : "" ) + '">'
                  + '<img src="' + theOtherArray[i].avatar_url + '" />'
                  + '<span>'
                  + theOtherArray[i].login
                  + '</span>'
                  + '</li>'
        }
        html += "</ul>";

        // Add the html to the context panel.
        $('.context_switcher .context_switcher_panel .orgs').html(html);

        // Bind click events to the contexts.
        // If a context is clicked, save the selcted context, close the context panel and update the context.
        // Only take action if the selected context does not equal the current context.
        $('.context_switcher_panel .orgs li').each( function() {
            $(this).on('click', function() {
                var newContext = $(this).attr('rel');
                if(newContext && newContext != mGitHub.context.login) {
                    setContext(newContext);
                    toggleContextMenu();
                    loadContext(newContext); 
                }
            });
        });

        // Update the application navigation to reflect what is available to the current context.
        $('.application_nav li[data=' + mContent + ']').removeClass('selected');

        // Adjust the navigation tabs based on the User type.
        // Organization context do not need to show 'watched', 'following', 'follower'.
        if( mGitHub.context.type != "User" ) {
            $('.application_nav li').each( function() {
                if( $(this).attr('data') != REPOS ) {

                     // Have slide up callback to hide element in DOM durring first popup.
                     // Set the current content to repos.
                     $(this).slideUp(ANIMATION_SPEED, function() { $(this).hide(); });
                     setContent(REPOS);
                 }
             });
        }

        // If the logged User is selected the navigation tabs will all be shown again.
        else {
            $('.application_nav li').each( function() { 
                $(this).slideDown(ANIMATION_SPEED); 
            }); 
        }
    }

	// Set the context switcher image and text.
	$('.context_switcher .context_switcher_button').html('<img src="' + mGitHub.context.avatar_url + '" />' + '<span>' + mGitHub.context.login + '</span>');
	
	// Set currently selected navication tab.
	$('.application_nav li[data=' + mContent + ']').addClass('selected');
	
	// Load content.
	loadContent();
};
 


/**
 * Load Following
 * 
 * Load users following/followers.
 * 
 * @param type - Following or Followers.
 * 
 */
function loadFollowing(type) {

    // Check for following in cache.
    var following = cacheLoad(mGitHub.context.login, type);

    // If following is cached then display them.
    // If not load following from GitHub.
    if(following) displayFollowing(type, following);
    else loadFromGitHub(mGitHub.context.login, [], 1);

    // Use recursion to load all following from GitHub.
    // A context parameter is required to make sure cache is saved with correct context.
    function loadFromGitHub(context, following, pageNumber) {
        $.getJSON(mGitHub.api_url + 'user/' + type + '?page=' + pageNumber, {access_token: mOAuth2.getAccessToken()})
            .success( function(json) {

                // If data is being returned keep recursing.
                if(json.length > 0) {
                    following = following.concat(json);
                    loadFromGitHub(context, following, ++pageNumber);
                }

                // If data is not returned:
                else {

                    // // If any following exists then load user names and diplay following.
                    // // After user names are returned save following to cache then display them.
                    if(following.length == 0) displayFollowing(type, following);
                    else {

                        // Make callback null, when last follower get name create a callback.
                        var callback = null;
                        for(var current in following) {
                            if(current == following.length -1) {
                                callback = function(data) {
                                    cacheSave(context, type, data);
                                    displayFollowing(type, data);
                                }
                            }
                            loadUserName(following, current, callback);
                        }
                    }
                }
            });
    };
};



/**
 * Load Forked Repo Parent
 * 
 * Load the parent of a forked repo.
 * 
 * @param repos - Set to get repo from.
 * @param index - Index of repo to load parent for.
 * @param callback - Callback function when loading complete.
 * 
 */
function loadForkedRepoParent(repos, index, callback) {
    if(repos[index].fork) {
        $.getJSON(mGitHub.api_url + 'repos/' + mGitHub.context.login + '/' + repos[index].name, {access_token: mOAuth2.getAccessToken()})
            .success(function(json) {
                repos[index].parent = json.parent.owner;

                if(callback) callback(repos);
            });
    }
    else { if(callback) callback(repos) };
};



/**
 * Load Repos
 * 
 * Load the appropriate repositories.
 * 
 * @param type - Type of repositories to load.
 * 
 */
function loadRepos(type) {

    // Attempt to load the repos from the cache.
    var repos = cacheLoad(mGitHub.context.login, type);

    // If the repos are found then trigger callback.
    // If they are not found then load them from GitHub.
    if(repos) callback(mGitHub.context.login, repos);
    else {
        // If we the context type is "User"
        if(mGitHub.context.type == "User") loadUserReposFromGitHub(mGitHub.context.login, [], 1);
        else loadOrgReposFromGitHub(mGitHub.context.login, [], 1, null);
    }

    // User recursion to load all of a Users repos from GitHub.
    function loadUserReposFromGitHub(context, repos, pageNumber) {
        $.getJSON(mGitHub.api_url + 'user/' + type + '?page=' + pageNumber, {access_token: mOAuth2.getAccessToken()})
            .success( function(json) {

                // If data is still being returned from GitHub keep
                // recursing to make sure all repos are retreived.
                if(json.length > 0) {
                    repos = repos.concat(json);
                    loadUserReposFromGitHub(context, repos, ++pageNumber);
                }

                else callback(context, repos);
        });
    };

    // Use recursion to load all of an organizations repos from GitHub.
    // For some reason GitHub API v3 does not return an empty set if 
    // no repos exist on the page, thus to stop from infinite recurrsion
    // we must make sure the last repo from the last request is not equal to
    // the last repo of the current request.
    // A context is required so callback knows what cache to save to.
    function loadOrgReposFromGitHub(context, repos, pageNumber, lastRepo) {
        $.getJSON(mGitHub.api_url + 'orgs/' + mGitHub.context.login + '/repos?page=' + pageNumber, {access_token: mOAuth2.getAccessToken()} )
            .success( function(json) {

                // Make sure repos exist.
                if(json.length == 0) {callback(context, repos);}

                // Check that new repos are still be retreived.
                else if(repos.length > 0 && json[json.length - 1].clone_url == lastRepo.clone_url) callback(context, repos);

                // Recurse.
                else {
                    repos = repos.concat(json);
                    loadOrgReposFromGitHub(context, repos, ++pageNumber, repos[repos.length - 1]);
                }
            });
    };

    // Callback from the repository loading.
    // A context is needed to make sure caching is handled correctly.
    function callback(context, repos) {

        // Take action according to repo type.
        switch(type) {

            // If users repos are being loaded from GitHub
            // then sort them by last updated, retreive the
            // forked repositories parent information, 
            // save them to cache and then display them.
            case REPOS :
                if(repos.length == 0) displayRepos(repos);
                else {
console.log(repos);
                    // Only make a callback for last repo.
                    var callback = null;
                    for(var current in repos) {
                        if(current == repos.length - 1) {
                            callback = function(data) {
                                data = sortReposByLastUpdated(data);
                                cacheSave(mGitHub.context.login, REPOS, data);
                                displayRepos(data);
                            }
                        }
                        loadForkedRepoParent(repos, current, callback);
                    }
                }
                break;
 
            // If watched repos are being loaded from GitHub
            // then filter out your own repos.  Save the repos
            // to cache then display them.
            case WATCHED : 
                repos = filterUserRepos(repos);
                cacheSave(mGitHub.context.login, WATCHED, repos);
                displayWatched(repos);
                break;

            // WTF...
            default: 
                break;
        }
    };
};



/**
 * Load User Name
 * 
 * Load a user name based on a login. (Saved to user object).
 * 
 * @param group - Group to get user name from.
 * @param index - Index of user in group.
 * @param callback - Callback when complete.
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
 * Will get extension settings from last application use.
 * 
 */
function onCreate() {

    // Set default local storage data if it does not exist.
    if( localStorage[CACHE_PREF] == undefined) { localStorage[CACHE_PREF] = CACHE_DEFAULT; }
    if( localStorage[CONTEXT]    == undefined) { localStorage[CONTEXT] = mGitHub.user.login; } 
    if( localStorage[CONTENT]    == undefined) { localStorage[CONTENT] = REPOS; }
    if( localStorage[FILTERS]    == undefined) { localStorage[FILTERS] = "{}"; }

    // Load users application state.
    mCaching = localStorage[CACHE_PREF] ? localStorage[CACHE_PREF] : CACHE_OFF;
    mGitHub.context = localStorage[CONTEXT] ? localStorage[CONTEXT] : mGitHub.user.login;
    mContent = localStorage[CONTENT] ? localStorage[CONTENT] : REPOS;

    // Load application state filters.
    var filters      = JSON.parse( localStorage[FILTERS] );
    mFilterFollowers = filters[FOLLOWERS] ? filters[FOLLOWERS] : "recently_followed";
    mFilterFollowing = filters[FOLLOWING] ? filters[FOLLOWING] : "recently_followed";
    mFilterRepos     = filters[REPOS] ? filters[REPOS] : "all_repositories";
    mFilterWatched   = filters[WATCHED] ? filters[WATCHED] : "last_watched";
};



/**
 * Set current content.
 * 
 * Set the current content in local storage and the global variable.
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
 * Just reverse the list.
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