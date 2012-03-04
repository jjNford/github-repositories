// This script will be injected into the OAuth2 redirect page specifies in the manifest and oauth2.js file.
var url = window.location.href;
var params = url.substring(url.indexOf('?'));
var redirect = chrome.extension.getURL('adapter.html');
window.location = redirect + params;