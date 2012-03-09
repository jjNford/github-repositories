/*
 * oauth2-chrome-extensions
 * <https://github.com/jjNford/oauth2-chrome-extensions>
 * 
 * Copyright (C) 2012, JJ Ford (jj.n.ford@gmail.com)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * This is a streamlined version of Boris Smus solution (Aapache License v2.0).
 * <https://github.com/borismus/oauth2-extensions>
 * 
 * <http://oauth.net/2/>
 * 
 */

/* NOTE
 * 
 * This was designed to work with the GitHub API v3. This source may need to be altered
 * to work with your providers API. However the method used to gain the OAuth2 token
 * should work if the code is correctly configured to the API being targeted.
 * Methods to update the token and save the expiration date may also need to be added.
 * 
 */
(function() {

	window.OAuth2 = {
	
		/**
		 * Initialize
		 */
		init: function() {
			this._key = "token";
			this._access_token_url = "https://github.com/login/oauth/access_token";
			this._authorization_url = "https://github.com/login/oauth/authorize";
			this._client_id = "911fa741a8b8dac7d28c";
			this._client_secret = "e13f2f8ba4d9892eb231b4fcf3257013736327d1";
			this._redirect_url = "https://github.com/robots.txt";
			this._scopes = ['repo'];
		},
	
		/**
		 * Begin
		 */
		begin: function() {
			var url = this._authorization_url + "?client_id=" + this._client_id + "&redirect_uri" + this._redirect_url + "&scope=";
	
			for(var i in this._scopes) {
				url += this._scopes[i];
			}
	
			chrome.tabs.create({url: url, selected: true}, function(data) {
				window.close();
				chrome.tabs.getCurrent(function(tab) {
					chrome.tabs.remove(tab.id, function(){});
				});
			});
		},
	
		/**
		 * Parses Access Code
		 * 
		 * @param url The url containing the access code.
		 */	
		parseAccessCode: function(url) {
			if(url.match(/\?error=(.+)/)) {
				chrome.tabs.getCurrent(function(tab) {
					chrome.tabs.remove(tab.id, function(){});
				});
			}
			else {
				this.requestToken(url.match(/\?code=([\w\/\-]+)/)[1]);
			}
		},
	
		/**
		 * Request Token
		 * 
		 * @param code The access code returned by provider.
		 */
		requestToken: function(code) {
			var that = this;
			var data = new FormData();
			data.append('client_id', this._client_id);
			data.append('client_secret', this._client_secret);
			data.append('code', code); 

			var xhr = new XMLHttpRequest();
			xhr.addEventListener('readystatechange', function(event) {
				if(xhr.readyState == 4) {
					if(xhr.status == 200) {
						that.finish(xhr.responseText.match(/access_token=([^&]*)/)[1]);
					}
					else {
						chrome.tabs.getCurrent(function(tab) {
							chrome.tabs.remove(tab.id, function(){});
						});
					}
				}
			});
			xhr.open('POST', this._access_token_url, true);
			xhr.send(data);
		},
	
		/**
		 * Finish
		 * 
		 * @param token The OAuth2 token given to the application from the provider.
		 */
		finish: function(token) {
			try {
				window['localStorage'][this._key] = token;
			}
			catch(error) {}

			chrome.tabs.getCurrent(function(tab) {
				chrome.tabs.remove(tab.id, function() {});
			});
		},
	
		/**
		 * Get Token
		 * 
		 * @return OAuth2 access token if it exists, null if not.
		 */
		getToken: function() {
			try {
				return window['localStorage'][this._key];
			}
			catch(error) {
				return null;
			}
		},
	
		/**
		 * Delete Token
		 * 
		 * @return True if token is removed from localStorage, false if not.
		 */
		deleteToken: function() {
			try {
				delete window['localStorage'][this._key];
				return true;
			}
			catch(error) {
				return false;
			}
		}
	};
	
	OAuth2.init();

})();