/* OAuth2 JavaScript Object
 *
 * Will authorize user with GitHub using OAuth2.
 *
 * Thank you Boris Smus for your concept of using an adapter page to prevent
 * background script from running when completing the OAuth2 flow.
 * http://smus.com/oauth2-chrome-extensions
 *
 */


// OAuth2 Object Constructor.
var OAuth2 = function() {
		
	// Local storage entries.
	access_token_key      = "oauth2_access_token";
	access_token_date_key = "oauth2_access_token_date";
	
	// GitHub OAuth2 data.
	client_id         = "911fa741a8b8dac7d28c";
	client_secret     = "e13f2f8ba4d9892eb231b4fcf3257013736327d1";
	redirect_url      = "https://github.com/robots.txt";
	access_token_url  = "https://github.com/login/oauth/access_token";
	authorization_url = "https://github.com/login/oauth/authorize";
	scopes            = [];
};


// GitHub OAuth2 Flow.
OAuth2.prototype.flow = {

	// OAuth2 Flow:
	// 1) Create an authorization url & redirecting the user to it.
	// 2) GitHub will respond by directing the browser to the given redirect
	//    URL where a script will be injected to pass the URL containing the 
	//    access code to an adapter page.
	// 3) The adapter page will parse out the access code and send a asynchronous
	//    request to GitHub with the code and application secret.
	//    to GitHub with the access code and application secret.
	// 4) GitHub will respond with an access token that will be stored in local storage.

	// Create url, add scopes to url, redirect to GitHub authorization page.
	begin: function() {
		
		var url = authorization_url
		        + "?client_id="    + client_id
		        + "&redirect_uri=" + redirect_url
		        + "&scope=";
		
		// Add access scopes.
		for(var scope in scopes) { url += scope + ","; }
		
		chrome.tabs.create({url: url, selected: true}, function(dataFromTab){});
		self.close();
	},
	
	// Injected script will get access code and redirect to adapter page.
	getAccessCode : function(url) {
		
		// Check for application access error.
		if( url.match(/\?error=(.+)/) ) {
			chrome.tabs.getCurrent(function(thisTab) {
				chrome.tabs.remove(thisTab.id, function(){});
			});
		}
		
		// If code received.
		else {
			code = url.match(/\?code=([\w\/\-]+)/)[1];
			this.getAccessToken(code);
		}
	},
	
	// Send request for access token to GitHub with access code and application
	// secret.  Finish OAuth2 when successful response has returned.
	getAccessToken : function(code) {
		
	 	var that = this;
	 	
	 	// Create form data for request.
	 	var formData = new FormData();
	 	formData.append('client_id', client_id);
	 	formData.append('client_secret', client_secret);
	 	formData.append('code', code);
	 	
	 	var xhr = new XMLHttpRequest();
	 	xhr.addEventListener('readystatechange', function(event) {
	 		if(xhr.readyState == 4) {
	 			if(xhr.status == 200) {
	 				that.finish(xhr.responseText.match(/access_token=([^&]*)/)[1]);
	 			}
	 			else {
	 				chrome.tabs.getCurrent(function(thisTab) {
	 					chrome.tabs.remove(thisTab.id, function(){});
	 				});
	 			}	 			
	 		}
	 	});
	 	xhr.open('POST', access_token_url, true);
	 	xhr.send(formData);
	},
	
	// Finish the OAuth2 flow by saving the access token and closing the adapter page.
	finish :  function(accessToken) {
		
		// Save token information in local storage.
		// API V3 does not support expiration date or refresh token.
		localStorage[access_token_key] = accessToken;
		localStorage[access_token_date_key] = (new Date).getTime();
		
		// Close the current page.
		chrome.tabs.getCurrent(function(thisTab) {
			chrome.tabs.remove(thisTab.id, function() {});
		});
	}
};


// Get GitHub OAuth2 access token.
OAuth2.prototype.getAccessToken = function() {
	return localStorage[access_token_key];
};


// Clear GitHub OAuth2 access tokens.
OAuth2.prototype.clearAccessToken = function() {
	delete localStorage[access_token_key];
	delete localStorage[access_token_date_key];
};