/**
 * Authentication
 * 
 * 
 */
window.App.authentication = {
	
	/**
	 * Validates that extension is authorized to access users private data.
	 * 
	 * @param pass Callback to be executed if validation is successful, sent user parameter.
	 * @param fail Callback to be executed if validation fails.
	 */
	validate : function(pass, fail) {
		if(OAuth2.getToken() === null) {
			// TODO: - popup.authentication.prompt();
		}
		else {
			jQuery.getJSON(App.API + "/user", {access_token: OAuth2.getToken()})
				.success(function(user) {
					if(user.type == "User") {
						
						// Load user's organizations.
						jQuery.getJSON(App.API + "/user/orgs", {access_token: OAuth2.getToken()})
							.success(function(orgs) {
								user.orgs = orgs;
								pass(user);
							});
					}
				})
				.error(function(json) {
					if(json.readyState == 0 && json.status == 0) {
						// There is no data connection.
					}
					else {
						fail();
					}
				});
		}
	},
	
	/**
	 * Prompts the user to authenticate extension with GitHub account.
	 */
	prompt : function() {
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