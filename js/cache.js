/*
 * HTML5 Caching
 * <https://github.com/jjNford/html5-caching>
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
 */
(function() {
	
	window.Cache = {
	
		init: function() {
			this.TTL = 900000;
			this.KEY = "cache.";
			this.PREF_ENABLED = "settings.caching";
			this.PREF_SMART = "settings.smart";
			this.THRESHOLD = 1;
		},
	
		/**
		 * @return Returns true if cache is cleared, false if not.
		 */
		clear: function() {
			try {
				for(var i = window['localStorage'].length - 1; i >= 0; i--) {
					var temp = window['localStorage'].key(i);
					if(new RegExp(this.KEY).test(temp)) {
						delete window['localStorage'][temp];
					}
				}
				return true;
			}
			catch(error) {
				return false;
			}
		},
	
		/**
		 * @return True if cache is enabled, false if not.
		 */
		isEnabled: function() {
			if(window['localStorage'] !== null) {
				try {
					return JSON.parse(window['localStorage'][this.PREF_ENABLED]);
				}
				catch(error) {
					return true;
				}
			}
			return false;
		},
	
		/**
		 * @return True if smart caching is on, false if not.
		 */
		isSmart: function() {
			if(this.isEnabled() === true) {
				try {
					return window['localStorage'][this.PREF_SMART];
				}
				catch(error) {
					return true;
				}
			}
			return false;
		},
	
		/**
		 * @param id The ID of the cache block to load from.
		 * @param key The address in the block to load data from.
		 * @return If smart caching is turned on, cached data object {expired: <>, data: <>}, null 
		 *         if no data found. If smart caching is turned off and cache has expired null is 
		 *         returned.
		 */
		load: function(id, address) {
			if(this.isEnabled() === true) {
				try {
					var payload = JSON.parse(window['localStorage'][this.KEY + id])[address];
					var timestamp = new Date().getTime();
					var expired = false;
	
					if(payload != null) {
						if(timestamp - payload.time > this.TTL) {
							if(this.isSmart() === false) {
								return null;
							}
							expired = true;
						}
						return {data: payload.data, expired: expired};
					}
					return null;
				}
				catch(error) {
					return null;
				}
			}
			return null;
		},
	
		/**
		 * @param id The ID of the cache block to save data to.
		 * @param key The address in the block to save data to.
		 * @param The data to cache.
		 * @return True if the data is cached, false if not.
		 */
		save: function(id, address, data, _missed) {
			if(this.isEnabled() === true) {
				try {
					if(!_missed || _missed <= this.THRESHOLD) {	
						var block = JSON.parse(window['localStorage'][this.KEY + id]);
						var timestamp = new Date().getTime();
						block[address] = {"time": timestamp, "data": data};
						window['localStorage'][this.KEY + id] = JSON.stringify(block);
						return true;
					}
					else {
						return false;
					}
				}
				catch (error) {
					if(!_missed) {
						_missed = 0;
					}
					window['localStorage'][this.KEY + id] = "{}";
					return this.save(id, address, data, ++_missed);
				}
			}
			return false;
		},
	
		/**
		 * @param bool True to turn caching on, false to turn it off.
		 */
		setEnabled: function(bool) {
			if(bool === true || bool === false) {
				try {
					window['localStorage'][this.PREF_ENABLED] = bool;
				}
				catch(error) {}
			}
		},
	
		/**
		 * @param bool True to turn smart caching on, false to turn it off.
		 */
		setSmart: function(bool) {
			if(bool === true || bool === false) {
				try {
					window['localStorage'][this.PREF_SMART] = bool;
				}
				catch(error) {}
			}
		}
	};
	
	Cache.init();
	
})();