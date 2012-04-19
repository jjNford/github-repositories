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

License
-------
[MIT License](http://en.wikipedia.org/wiki/MIT_License) (c) [JJ Ford](http://jjnford.com)

Contributing Projects
---------------------
- [MIT License](http://en.wikipedia.org/wiki/MIT_License)
  - [jQuery](https://github.com/jquery/jquery)
  - [jQuery Timeago](https://github.com/rmm5t/jquery-timeago)
  - [HTML5 Storage](https://github.com/jjNford/html5-storage)
  - [HTML5 Caching](https://github.com/jjNford/html5-caching)
  - [Chrome Extension Socket](https://github.com/jjNford/chrome-extension-socket)
  - [OAuth2 Chrome Extension](https://github.com/jjNford/oauth2-chrome-extension)
  - [GitHub Notifier](https://github.com/sindresorhus/GitHub-Notifier)
- [Apache v2.0](http://www.apache.org/licenses/LICENSE-2.0.html)
  - [OAuth2 Chrome Extension](https://github.com/jjNford/oauth2-chrome-extension)
- [GPL v2.0](http://www.gnu.org/licenses/gpl-2.0.html)
   - [jQuery](https://github.com/jquery/jquery)


Changelog
---------

### v2.1.5
- Fix notifications unread count positioning.

### v2.1.4
- Add "Create a New Repo" button in the user links.

### v2.1.3
- Remove feedback link to Web Store.

### v2.1.2
- Remove excessive white space from dashboard.
- Add feedback link to Web Store reviews.
- Fix following/followers DOM cleansing. 

### v2.1.1
- Protect display post locks on null data returns from socket.
- Remove data items from the DOM on refreshes if no longer relevant.

### v2.1.0
- Make CSS more consistent with GitHub
- Add quick links to repository extras
- Display the number of user repositories in the context switcher panel
- Add a new cloning link copy notification
- Create CSS button classes
- Changed repository sort time from "updated_at" to "pushed_at"
- Remove forked repository with name changes from showing in organization repos
- Add smarting caching that is offloaded to a background page
- Dynamically update the DOM instead of calling display refresh
- Improve instant search results
- Add user notifications
- Refactored source

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