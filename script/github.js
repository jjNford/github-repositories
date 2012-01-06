
// Object Constructor
var GitHub = function() {
	
	// Create a context handle for anonymous function closure & scoping.
	context = this;
	
	// Local storage entries.
	access_token      = "github_access_token";
	access_token_date = "github_access_token_date";
};

// GitHub API Attributes
GitHub.prototype.api = {
	client_id         : "911fa741a8b8dac7d28c",
	client_secret     : "e13f2f8ba4d9892eb231b4fcf3257013736327d1",
	api_url           : "https://api.github.com/",
	redirect_url      : "https://github.com/robots.txt",
	access_token_url  : "https://github.com/login/oauth/access_token",
	authorization_url : "https://github.com/login/oauth/authorize",
	scopes            : [],
	
	// API Get request (requires jQuery).
	get : function(variable, api_uri, callback) {
		var data = {access_token: context.getAccessToken()};	
		$.getJSON(context.api.api_url + api_uri, data)
			.success(function(data){
				context[variable] = data;
				callback(data);
			})
			.error(function(data){
				
				// Make sure an internet connection exists.
				if(data.readyState == 0 && data.status ==0) {}
				else { callback(false); }
			}
		);
	}
};

// GitHub OAuth2 Interface.
GitHub.prototype.oauth2 = {

	// OAuth2 Flow:
	// 1) Creating an authorization url & redirecting the user there.
	// 2) GitHub will redirect back to the redirect url where the 
	//    the extension will inject a script to retrieve an authorization
	//    code.  The script will then send the code to an adapter page 
	//    that can communicate with the extension.
	// 3) The authorization code will be processed and a request will be
	//    sent back to GitHub requesting an authorization token.
	// 4) GitHub will respond accordingly.

	// Begin the OAuth2 flow.
	begin: function() {
		var url = context.api.authorization_url
		        + "?client_id=" + context.api.client_id
		        + "&redirect_uri=" + context.api.redirect_url
		        + "&scope=";
		
		for(var scope in context.api.scopes) { url += scope + ","; }
		chrome.tabs.create({url: url, selected: true}, function(dataFromTab){});
		self.close();
	},
	
	// Process OAuth2 authorization code from GitHub produced by the injected script.
	processCode : function(url) {
		
		// Check if there was an error with the authorization credentials.
		var error = url.match(/\?error=(.+)/);
		if(error) {
			chrome.tabs.getCurrent(function(thisTab) {
				chrome.tabs.remove(thisTab.id, function(){});
			});
		}
		
		// If an OAuth2 authorization code was received then continue with OAuth2 flow.
		else {
			code = url.match(/\?code=([\w\/\-]+)/)[1];
			this.getAccessToken(code);
		}
	},
	
	// Request an access token from GitHub.
	// Use XMLHttpRequest instead of jQuery ajax to speed up the adapter page by
	// eliminating the need to the load the jQuery library.
	getAccessToken : function(code) {
	 	var that = this;
	 	
	 	// Create form data for request.
	 	var formData = new FormData();
	 	formData.append('client_id', context.api.client_id);
	 	formData.append('client_secret', context.api.client_secret);
	 	formData.append('code', code);
	 	
	 	var xhr = new XMLHttpRequest();
	 	xhr.addEventListener('readystatechange', function(event) {
	 		if(xhr.readyState == 4) {
		
	 			// If request is successful finish the OAuth2 flow.
	 			if(xhr.status == 200) {
	 				that.finish(xhr.responseText.match(/access_token=([^&]*)/)[1]);
	 			}
	
	 			// If the authorization fails close the current tab.
	 			else {
	 				chrome.tabs.getCurrent(function(thisTab) {
	 					chrome.tabs.remove(thisTab.id, function(){});
	 				});
	 			}	 			
	 		}
	 	});
	 	xhr.open('POST', context.api.access_token_url, true);
	 	xhr.send(formData);
	},
	
	// Finish the OAuth2 flow by saving the access token, closing the adapter
	// page, and opening the extension.
	finish :  function(accessToken) {
		
		// Save token information in local storage.
		// API V3 does not support expiration date or refresh token.
		localStorage[access_token] = accessToken;
		localStorage[access_token_date] = (new Date).valueOf();
		
		// Close the current page.
		chrome.tabs.getCurrent(function(thisTab) {
			chrome.tabs.remove(thisTab.id, function() {});
		});
	}
};

// Get GitHub OAuth2 access token.
GitHub.prototype.getAccessToken = function() {
	return localStorage[access_token];
};

// Clear GitHub OAuth2 access token.
GitHub.prototype.clearAccessToken = function() {
	delete localStorage[access_token];
	delete localStorage[access_token_date];
};

// Get user data from GitHub.
GitHub.prototype.loadUser = function(callback) {	
	context.api.get('user', 'user', callback);
};

// Get user repositories from GitHub.
GitHub.prototype.loadRepositories = function(callback) {
    context.api.get('repositories', 'user/repos', callback);
};

// Get watched repositories from GitHub.
GitHub.prototype.loadWatched = function(callback) {
	context.api.get('watched', 'user/watched', callback);
};

// Get watched repositories from GitHub.
GitHub.prototype.loadWatched = function(callback) {
	context.api.get('watched', 'user/watched', callback);
};

// Get users being followed.
GitHub.prototype.loadFollowing = function(callback) {
	context.api.get('following', 'user/following', callback);
};

// Get following users.
GitHub.prototype.loadFollowers = function(callback) {
	context.api.get('followers', 'user/followers', callback);
};