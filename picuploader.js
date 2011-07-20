function PicUploader(dataObj){ 
		/**
		 * UPLOAD_RATE determines the speed in which the progree meter should run
		 * based on the size of the image uploaded.
		 * 
		 * It is calculated based on a median time (in milliseconds) required for
		 * uploading an image of size 4MB (~ 4046357 bytes)
		 * 
		 * Median time for an image size 4046357 bytes is 12000 milliseconds
		 * UPLOAD_RATE = 12000 / 4046357 = 0.00297 (time / size)
		 *
		 * @constant UPLOAD_RATE
		 * @private
		 */	
	var UPLOAD_RATE = 0.00297,
		/**
		 * Private static variables 
		 */	
		instance = this,
		d = document, 
		get = "getElementById", // Shortcut for document.getElementById to enable compression			
		imgLoadedState, // Flag to maintain image loaded state
		uploadFormName = dataObj.uploadForm, // The form name to simulate AJAX
		uploadForm, // Local variable to cache form element
		fileObj = dataObj.file, // The file input type
		fileNameLayer = d[get](dataObj.fileNameLayer), // File name div
		progMeterLayer = d[get](dataObj.progressMeterLayer), // Progress Meter layer
		errorLayer = d[get](dataObj.errorLayer), // Error layer
		imageWrapper = d[get](dataObj.imageWrapper), // Image Wrapper
		controls = d[get](dataObj.controlsLayer), // controls layer
		overlay = d[get](dataObj.overlayLayer), // Overlay layer
		zoomImageLayer = d[get](dataObj.zoomLayer), // Zoom image layer
		maskLayer = dataObj.maskLayer, // mask layer
		finalCb = dataObj.finalCb, // Final callback to execute after upload complete
		serverURL = dataObj.serverURL || PicUploader.serverURL, // Get the server URL for uploading the picture
		progMeter = new ProgressMeter({progressLayer: dataObj.progressLayer, percentLayer: dataObj.percentLayer}), // creating Progress Meter Object instance
		thumbnailImage, // Thumbnail image element
		canvasElem, // Canvas element 
		hide = function(elem, display) { // Hides a layer 
			if(display) { // If sets then hides display
				elem.style.display = "none";
			} else {
				elem.style.visibility = "hidden";
			}
		},
		show = function(elem, display) { // Shows a layer
			if(display) { // If set makes display block
				elem.style.display = "block";
			} else {
				elem.style.visibility = "visible";
			}			
		},
		updateContent = function(elem, content) {
			elem.innerHTML = content;
		},
		updateError = function(msg) {
			updateContent(errorLayer, msg);
			show(errorLayer);
		},
		getInterval = function(size) {
			// Getting it for the 90th percentile
			var interval = Math.abs((size * UPLOAD_RATE)/90);
			// If interval is less that 5ms then default it to 5ms
			// Due to clamping successive intervals DOM_CLAMP_TIMEOUT_NESTING_LEVEL 
			// https://developer.mozilla.org/en/DOM/window.setTimeout#Minimum_delay_and_timeout_nesting
			return interval < 5? 5: interval;
		},
		createImage = function(src, h, w) {
			var img = document.createElement('img');
			img.height = h;
			img.width = w;
			img.src = src;
			return img;
		},
		createIframe = function(id) {
			var iframe;
			try{
				// To overcome IE hack
				iframe = d.createElement('<iframe name="' + id + '">');
			} catch(ex) {
				iframe = d.createElement('iframe');
				iframe.setAttribute('name', id);
			}
			
			iframe.setAttribute('id', id);						
			iframe.style.display = 'none';
	        document.body.appendChild(iframe);

	        return iframe;			
		},
		createForm = function(iframe, file) {
			var form = d.createElement('form');
	        form.setAttribute('action', serverURL);
	        form.setAttribute('target', iframe.name);
	        form.style.display = 'none';
	        document.body.appendChild(form);
	        form.appendChild(file);
	        
	        return form;			
		},
		getIframeResponse = function(iframe) {
	        // iframe.contentWindow.document - for IE<7
	        var doc = iframe.contentDocument ? iframe.contentDocument: iframe.contentWindow.document,
	            response;
	        try {
	            response = eval("(" + doc.body.innerHTML + ")");
	        } catch(err){
	            response = null;
	        }

	        return response;
		},
		attach = function(element, type, fn) {
		    if (element.addEventListener){
		        element.addEventListener(type, fn, false);
		    } else if (element.attachEvent){
		        element.attachEvent('on' + type, fn);
		    }			
		},
		uploadAJAX = function(fileInfo, cb) {
			var xhr = new XMLHttpRequest();
			
			xhr.upload.onprogress = function(e){
	            if (e.lengthComputable){	
	            	var percentUpload = Math.round(e.loaded / e.total * 100);
	            	if(percentUpload > 90) {
	            		percentUpload = 90;
	            	} 
	            	progMeter.progress(percentUpload);
	            }
	        };
	        
	        xhr.onreadystatechange = function(){
	            if (xhr.readyState == 4){
	            	if (xhr.status == 200){	            		
	            		cb(eval("(" + xhr.responseText + ")"));
	            	} else {
	            		cb();
	            	}
	            }
	        };	
	        
	        xhr.open("POST", serverURL + "?picfile=" + fileInfo.name, true);
	        // Not sure if these are required
	        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	        xhr.setRequestHeader("X-File-Name", encodeURIComponent(fileInfo.name));
	        xhr.setRequestHeader("Content-Type", "application/octet-stream");	        
	        xhr.send(fileInfo.file);	        
		},
		uploadIframe = function(fileInfo, cb) {
			var iframe = createIframe(fileInfo.name);
			!uploadForm && (uploadForm = d[get](uploadFormName)); 
			uploadForm.setAttribute('target', iframe.name);
			attach(iframe, 'load', function() {
	            // when we remove iframe from dom
	            // the request stops, but in IE load
	            // event fires
	            if (!iframe.parentNode){
	                return;
	            }

	            // fixing Opera 10.53
	            if (iframe.contentDocument &&
	                iframe.contentDocument.body &&
	                iframe.contentDocument.body.innerHTML == "false"){
	                // In Opera event is fired second time
	                // when body.innerHTML changed from false
	                // to server response approx. after 1 sec
	                // when we upload file with iframe
	                return;
	            }
	            
	            // Handle the response
	            cb(getIframeResponse(iframe));
	            
	            // Delete the iframe with a timeout to fix busy state in FF3.6
	            setTimeout(function(){
	            	iframe.parentNode.removeChild(iframe);
	            }, 1);
			});
			
			// Submit the form
			uploadForm.submit();
			
			// Start the progess meter
			progMeter.start(getInterval(fileInfo.size));

		},
		// Decide upload functionality based on browser support 
		uploadServer = fileObj.multiUpload? uploadAJAX: uploadIframe; // ALAX based approach or hidden Iframe based approach
		
		
	this.upload = function() {
		
		var t = this;
		
		// Hide the error message if any
		hide(errorLayer);

		// Update the file name
		updateContent(fileNameLayer, fileObj.name);			
		
		// Show the file name Layer
		show(fileNameLayer);
		
		// Show the progress bar
		show(progMeterLayer);
				
		uploadServer(fileObj, function(res) {
			t.handleResponse(res);
		});
	};
	
	this.handleResponse = function(res) {
		// Get error message if any
		var err = !res? "No response from server. Try again": res.error,
			img,
			that = this;
		
		if(err) {
			updateError(err.msg); // Update error
		} else { // Success	
			// Load the image before completing the progress meter, so the images are shown seemlessly		
			// Hide the display to preserve the dimensions
			hide(imageWrapper, 1);
			// Clear the image wrapper first
			updateContent(imageWrapper, "");				
			// Create and add the image
			imageWrapper.appendChild(thumbnailImage = createImage(res.data.picURL, 131, 200));
			// Create the canvas element
			//(canvasElem = document.createElement("canvas")) && imageWrapper.appendChild(canvasElem);				
		
			// Complete the progress meter with the callback which calls the final complete
			progMeter.complete(function(r) {
				return function() {
							that.complete(r);
						};
				}(res));
	
		}	
				
		// Call the final callback
		finalCb && finalCb();
	};
	
	this.complete = function(res) {
		
		// Hide the file name
		hide(fileNameLayer);
		
		// Hide the progress meter layer
		hide(progMeterLayer);
		
		// Show the wrapper (both visibility & display) 
		show(imageWrapper);
		show(imageWrapper, 1);
		
		// Show the controls
		show(controls);
		
		// Create image in zoom overlay
		updateContent(zoomImageLayer, "");
		zoomImageLayer.appendChild(createImage(res.data.picURL, 531, 800));
		
		// Update the image loaded state
		imgLoadedState = 1;			
	};
	
	this.deleteImage = function() {
		
		// Clear the image wrapper
		updateContent(imageWrapper, "");
		
		// Reset the Progress Meter
		progMeter.progress(0);
				
		// Hide controls
		hide(controls);
		
		// Reset the image loaded state
		imgLoadedState = 0;
	};
	
	this.showControls = function() {
		imgLoadedState && show(controls);
	};
	
	this.hideControls = function() {
		imgLoadedState && hide(controls);
	};
	
	this.zoomImage = function() {			
		show(maskLayer, 1);
		show(overlay, 1);
	};
	
	this.closeOverlay = function() {
		hide(maskLayer, 1);
		hide(overlay, 1);			
	};
	
	this.rotateLeft = function() {
		if(!canvasElem) {
			return;
		}
		var cContext = canvasElem.getContext('2d'),
			cw = thumbnailImage.width, 
			ch = thumbnailImage.height, 
			cx = 0, 
			cy = 0,
			degree = 0;
		//   Calculate new canvas size and x/y coorditates for image
		switch(degree){
		     case 90:
		          cw = thumbnailImage.height;
		          ch = thumbnailImage.width;
		          cy = thumbnailImage.height * (-1);
		          break;
		     case 180:
		          cx = thumbnailImage.width * (-1);
		          cy = thumbnailImage.height * (-1);
		          break;
		     case 270:
		          cw = thumbnailImage.height;
		          ch = thumbnailImage.width;
		          cx = thumbnailImage.width * (-1);
		          break;
		}
		//  Rotate image
		canvasElem.setAttribute('width', cw);
		canvasElem.setAttribute('height', ch);
		cContext.rotate(degree * Math.PI / 180);
		cContext.drawImage(thumbnailImage, cx, cy);			
	};
	
	// Bind events
	attach(d[get](dataObj.picContainer), "mouseover", function(){
		instance.showControls();
	});
	attach(d[get](dataObj.picContainer), "mouseout", function(){
		instance.hideControls();
	});
	attach(d[get](dataObj.closeZoomLink), "click", function(){
		instance.closeOverlay();
		return false;
	});
	attach(d[get](dataObj.zoomControl), "click", function(){
		instance.zoomImage();
	});
	attach(d[get](dataObj.deleteControl), "click", function(){
		instance.deleteImage();
	});	
};

PicUploader.serverURL = "upload.php";
