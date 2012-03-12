/*
 * Chrome Extension Socket
 * <https://github.com/jjNford/chrome-extension-socket>
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

	window.Socket = {
	
		init: function() {
			this.port = chrome.extension.connect({name: "popupToBackground"});
			this.tasks = 0;

			chrome.extension.onConnect.addListener(function(port) {
	
				// Create a socket from the background to the popup when popup is opened.
				if(port.name == "backgroundToPopup") {}
				else if(port.name == "popupToBackground") {
					Socket.port = chrome.extension.connect({name: "backgroundToPopup"});
				}
				else {
					return;
				}
	
				// Add message listener to port.
				port.onMessage.addListener(function(msg) {
					try {

						// If a task is being posted to the background page, keep note.
						if(msg.type === "task") {
							Socket.tasks++;
						}
	
						// Call correct namespace function.
						if(msg.type === "message" || msg.type === "task") {
							window[msg.namespace][msg.literal][msg.method].apply(this, msg.args);
						}
	
						// If task is complete, hide the loading notification.
						else if(msg.type === "taskComplete") {
							jQuery('.user_links.loading').hide();
						}
					}
					catch(UnknownDestination) {}
				});

				// Add disconnect listener to port.
				port.onDisconnect.addListener(function(port) {
					Socket.port.onMessage.removeListener(function() {});
					port.onMessage.removeListener(function() {});
				});
			});
		},
	
		/**
		 * Post Message
		 * 
		 * Posts a message to be sent through the socket.
		 * 
		 * @param - namespace - Namespace of message destination.
		 * @param - literal - Object of message destination.
		 * @param - method - Method of message destination.
		 * @param - args - Array of arguments to pass through socket.
		 */
		postMessage: function(namespace, literal, method, args) {
			try {
				this.port.postMessage({type: "message", namespace: namespace, literal: literal, method: method, args: args});
			}
			catch(portError) {
				// Catch errors just in case.
			}
		},

		/**
		 * Post Task
		 * 
		 * Post a task message to be sent through the socket.  This will
		 * increment the background page task counter.
		 * 
		 * @param - namespace - Namespace of message destination.
		 * @param - literal - Object of message destination.
		 * @param - method - Method of message destination.
		 * @param - args - Array of arguments to pass through socket.
		 */
		postTask: function(namespace, literal, method, args) {

			// Display loading notification for background task.
			if(this.port.name == "popupToBackground") {
				jQuery('.user_links.loading').show();
			}
	
			try {
				 this.port.postMessage({type: "task", namespace: namespace, literal: literal, method: method, args: args});
			}
			catch(disconnectedPortError) {
				// Catch errors just in case.
			}
		},

		/**
		 * Post Task Complete
		 * 
		 * Post a task complete message to be sent through the socket.  This
		 * will decrement the background page task counter.
		 */
		postTaskComplete: function() {
			if(--this.tasks == 0) {
				try {
					this.port.postMessage({type: "taskComplete"});
				}
				catch(disconnectedPortError) {
					// Catch errors just in case.
				}
			}
		}
	};

	Socket.init();

})();