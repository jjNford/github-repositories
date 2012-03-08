GITHUB REPOSITORIES
===================
GitHub Repositories is an open source Google Chrome Extension project.
Check it out in the [Google Chrome Web Store](https://chrome.google.com/webstore/detail/jgekomkdphbcbfpnfjgcmjnnhfikinmn)

Development
-----------
User data is retrieved using the [GitHub API V3](http://developer.github.com/v3/) and [OAuth2](http://oauth.net/2/).

### Branches ###
- `master` is the primary development branch.
- `release` is the latest deployed version of the extension.

Publishing
----------
Release version numbers will follow the format:

`<version>.<update>.<patch>`

All source code is minified before being published to the [Google Chrome Web Store](https://chrome.google.com/webstore/detail/jgekomkdphbcbfpnfjgcmjnnhfikinmn).

External Libraries
------------------
- [GitHub API v3] (http://developer.github.com/v3/)
- [jQuery](https://github.com/jquery/jquery) (included)
- [jQuery Timeago](https://github.com/rmm5t/jquery-timeago) (included)
- [HTML5 Storage](https://github.com/jjNford/html5-storage) (included)
- [HTML5 Caching](https://github.com/jjNford/html5-caching) (included)
- [Chrome Extension Socket](https://github.com/jjNford/chrome-extension-socket) (included)
- [OAuth2 Chrome Extension](https://github.com/jjNford/oauth2-chrome-extension) (included)

License
-------
- [MIT](http://www.opensource.org/licenses/mit-license.php)
- [Apache License v2.0](http://www.apache.org/licenses/LICENSE-2.0.html)
- [General Public License v2.0](http://www.opensource.org/licenses/gpl-2.0.php)

Changelog
---------

### v2.0.5
- Added Google Analytics number to source (not worthy of an update - developer mistake)

### v2.0.4
- Update manifest description

### v2.0.3
- If not context is found it will fallback to the user account context
- Updated tooltip CSS and moved the copied tooltip to show under the url input box

### v2.0.2
- Can now get changed (name) forked organization repo parents
- Change context to be tracked by user ID rather than login
- Removed merge sort and binary search functions for context hunting (I know... overkill)

### v2.0.1
- Copy cloning links to clipboard automatically
- Add expand graphic to repository view
- Stop extension from lockup up when failing to get changed organization forked repos

### v2.0.0
- Context switching
- Public, Private, Watched, Organization, and Forked repos available
- Ability to download and get cloning links from extension
- Filter data results
- Instant search
- New settings menu

### v2.0.0 beta
- Upgrade to GitHub API v3
- Access to private data using OAuth2
- New GUI for accessing data

### v1.0.0
- Original release
- Public access only