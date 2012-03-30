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
			this.tasks = 0;
			this.port = chrome.extension.connect({name: "popupToBackground"});
			this.bind();
		},

		/**
		 * Bind
		 */
		bind: function() {
			// Attach connection listener to port.
			chrome.extension.onConnect.addListener( function(port) {
				if(port.name === "popupToBackground") {
					Socket.port = chrome.extension.connect({name: "backgroundToPopup"});
				}

				// Attach message listener to port.
				port.onMessage.addListener( function(msg) {
					Socket.onMessage(msg);
				});

				// Attach disconnection listener to port.
				Socket.port.onDisconnect.addListener( function(port) {
					port.onMessage.removeListener();
					Socket.port.onMessage.removeListener();
				});
			});
		},
	
		/**
		 * On Message
		 * 
		 * Triggered when the port receives a new message.
		 * 
		 * @param msg Message received from the port.
		 */
		onMessage: function(msg) {
			try {
				// Increment task count if task message is posted to background.
				if(msg.type === "task") {
					Socket.tasks++;
				}

				// Trigger posted message function.
				if(msg.type === "message" || msg.type === "task") {
					window[msg.namespace][msg.literal][msg.method].apply(this, msg.args);
				}

				// If task is complete, hide the loading notification.
				else if(msg.type === "taskComplete") {
					jQuery('.user_links.loading').hide();
				}
			}
			catch(UnknownDestination) {
				// Catch errors for unknown message destinations.
			}
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
		postMessage: function(msg) {
			try {
				msg.type = "message";
				this.port.postMessage(msg);
			}
			catch(SocketPostError) {
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
		postTask: function(msg) {

			// Display loading notification for background task.
			if(this.port.name === "popupToBackground") {
				jQuery('.user_links.loading').show();
			}
	
			try {
				msg.type = "task";
 				this.port.postMessage(msg);
			}
			catch(SocketPostError) {
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
			if(--this.tasks === 0) {
				try {
					this.port.postMessage({type: "taskComplete"});
				}
				catch(SocketPostError) {
					// Catch errors just in case.
				}
			}
		}
	};

	Socket.init();

})();