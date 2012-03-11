(function() {

	window.Authentication = {
	
		/**
		 * Validate that extension still has permission to access users private data.
		 * 
		 * @param success Callback to be executed if validation is successful, sent user parameter.
		 * @param error Callback to be executed if validation fails.
		 */
		validate: function(success, error) {
			if(OAuth2.getToken() == null) {
				error();
			}
			else {

				// To validate user, load user object from GitHub.
				jQuery.getJSON("https://api.github.com/user", {access_token: OAuth2.getToken()})
					.success(function(json) {
						if(json.type == "User") {
	
							var user = {};
							user.logged = json;
	
							// Load user's organizations.
							jQuery.getJSON("https://api.github.com/user/orgs", {access_token: OAuth2.getToken()})
								.success(function(json) {
	
									// Save user name for notifier to use.
									Storage.save("login", user.logged.login);

									user.orgs = json;
									success(user);
								});
						}
					})
					.error(function(json) {
						if(json.readyState == 0 && json.status == 0) {
							// There is no data connection.
						}
						else {
							error();
						}
					});
			}
		},
	
		/**
		 * Prompt for extension to be authorized to access private GitHub data.
		 */
		prompt: function() {
			jQuery('.github_header').delay(500).fadeOut(200, function() {
				jQuery('body').removeClass('loading').animate({width:"413px", height:"269px"}, function() {
					jQuery('#authorization').delay(750).fadeIn(225);
					jQuery('#authorization button').on('click', function() {
						OAuth2.begin();
					});
				});
			});
		}
	};

})();