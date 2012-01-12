// To continue the OAuth2 flow:
// 1) Get the current URL
// 2) Build a new parameter to hold the authorization code.
// 3) Get a reference to the extension adapter.
// 4) Send the parameters to the adapter.
var url = window.location.href;
var params = url.substring(url.indexOf('?'));
var redirect = chrome.extension.getURL('adapter.html');
window.location = redirect + params;