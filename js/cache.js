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
		
		_ttl: 900000, // 15 minutes
		
		_key: "cache.",
		_enabled: "pref.cen",
		_smart: "pref.csm",
		
		_threshold: 1,
		
		_name: "Cache",
		
		/**
		 * Remove all data from the cache.
		 * 
		 * @return Returns true if cache is cleared, false if not.
		 */
		clear: function() {
			try {
				for(var i = window['localStorage'].length - 1; i >= 0; i--) {
					var temp = window['localStorage'].key(i);
					if(new RegExp(this._key).test(temp)) {
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
		 * Returnes whether or not cache is enabled.
		 * 
		 * @return True if cache is enabled, false if not.
		 */
		isEnabled: function() {
			if(window['localStorage'] !== null) {
				try {
					var temp = window['localStorage'][this._enabled];
					return temp ? temp : true;
				}
				catch(error) {
					return false;
				}
			}
			return false;
		},
		
		/**
		 * Returns whether or not smart caching is on or off.
		 * 
		 * @return True if smart caching is on, false if not.
		 */
		isSmart: function() {
			if(this.isEnabled() === 'true') {
				try {
					var temp = window['localStorage'][this._smart];
					return temp ? temp : true;
				}
				catch(error) {
					return false;
				}
			}
			return false;
		},
		
		/**
		 * Loads data from cache.
		 * 
		 * @param id The ID of the cache block to load from.
		 * @param key The address in the block to load data from.
		 * @return If smart caching is turned on, cached data object {expired: <>, data: <>}, null 
		 *         if no data found. If smart caching is turned off and cache has expired null is 
		 *         returned.
		 */
		load: function(id, address) {
			if(this.isEnabled() == 'true') {
				try {
					var payload = JSON.parse(window['localStorage'][this._key + id])[address];
					var timestamp = new Date().getTime();
					var expired = false;
					
					if(payload != null) {
						if(timestamp - payload.time > this._ttl) {
							if(this.isSmart() === 'false') {
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
		 * Saves data to the cache.
		 * 
		 * @param id The ID of the cache block to save data to.
		 * @param key The address in the block to save data to.
		 * @param The data to cache.
		 * @return True if the data is cached, false if not.
		 */
		save: function(id, address, data, _missed) {
			if(this.isEnabled() === 'true') {
				try {
					if(!_missed || _missed <= this._threshold) {						
						var block = JSON.parse(window['localStorage'][this._key + id]);
						var timestamp = new Date().getTime();
						block[address] = {"time": timestamp, "data": data};
						window['localStorage'][this._key + id] = JSON.stringify(block);
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
					window['localStorage'][this._key + id] = "{}";
					return this.save(id, address, data, ++_missed);
				}
			}
			return false;
		},
		
		/**
		 * Turns caching on/off (default on).
		 * 
		 * @param bool True to turn caching on, false to turn it off.
		 */
		setEnabled: function(bool) {
			if(bool === true || bool === false) {
				try {
					window['localStorage'][this._enabled] = bool;
				}
				catch(error) {}
			}
		},
		
		/**
		 * Turns smart caching on/off (default on).
		 * 
		 * @param bool True to turn smart caching on, false to turn it off.
		 */
		setSmart: function(bool) {
			if(bool === true || bool === false) {
				try {
					window['localStorage'][this._smart] = bool;
				}
				catch(error) {}
			}
		}
	}
	
})();