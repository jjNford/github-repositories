/*
 * Local Storage Plus
 * <https://github.com/jjNford/localstorage-plus>
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
	
	var _ = window.Storage;
	
	window.Storage = {

		_: _,
		
		_exception: "StorageException",
		
		_throw: false,
		
		name: "Storage",

		/**
		 * Removes all data from localStorage.
		 * 
		 * @return True if localStorage is cleared, false if not.
		 * @throws StorageException
		 */
		clear: function() {
			try {
				window['localStorage'].clear();
				return true;
			}
			catch(error) {
				if(this._throw === true) {
					throw this._exception;
				}
				return false;
			}
		},
		
		/**
		 * Determine if the browser supports localStorage.
		 * 
		 * @param fn Callback to be run if localStorage is not supported (optional).
		 * @return True if localStorage is supported, false if not.
		 * @throws StorageException
		 */
		isSupported: function(fn) {
			try {
				if(window['localStorage'] !== null) {
					return true;
				} 
				else {
					return false;
				}
			}
			catch(error) {
				if(typeof fn == 'function') {
					fn();
				}
				if(this._throw === true) {
					throw this._exception;
				}
				return false;
			}
		},
		
		/**
		 * Load data from the localStorage.
		 * 
		 * @param key The hash key to load data from.
		 * @return The stored data, null if no data if found.
		 * @throws StorageException
		 */
		load: function(key) {
			try {
				var temp = window['localStorage'][key];
				try {
					return JSON.parse(temp);
				}
				catch(error) {
					return temp;
				}
			}
			catch(error) {
				if(this._throw === true) {
					throw this._exception;
				}
				return null;
			}
		},
		
		/**
		 * Removes data stored under the given hash key from localStorage.
		 * 
		 * @param key The hash key the data to remove is stored under.
		 * @return True if the data is found and removed, false if not.
		 * @throws StorageException
		 */
		remove: function(key) {
			try {
				delete window['localStorage'][key];
				return true;
			}
			catch(error) {
				if(this._throw === true) {
					throw this._exception;
				}
				return false;
			}
		},
		
		/**
		 * Saves data to localStorage.
		 * 
		 * @param key The hash key to save the data under.
		 * @param data The data to be saved.
		 * @return True if data is saved successfully, false if not.
		 * @throws StorageException
		 */
		save: function(key, data) {
			try {
				if(typeof data === 'object') {
					data = JSON.stringify(data);
				}
				window['localStorage'][key] = data;
				return true;
			}
			catch(error) {
				if(this._throw === true) {
					throw this._exception;
				}
				return false;
			}
		},
		
		/**
		 * Turn on/off localStroage exceptions (default off).
		 * 
		 * @param bool Enable or disable localStorage Enhaced exceptions.
		 */
		setExceptions: function(bool) {
			if(bool === true || bool === false) {
				this._throw = bool;
			}
		},
		
		/**
		 * Get the number of entries currently in localStorage.
		 * 
		 * @return The lenght of the localStorage.
		 * @throws StorageException
		 */
		size: function() {
			try {
				return window['localStorage'].length;
			}
			catch(error) {
				if(this._throw === true) {
					throw this._exception;
				}
				return 0;
			}
		}
	};
	
})();