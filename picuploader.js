function PicUploader(dataObj){ 
	/**
	 * Math attributes for acurate progress meter 
	 */	
	var medianTime = dataObj.medianTime || PicUploader.MEDIAN_TIME, // Override from data object if avialble
		medianSize = dataObj.medianSize || PicUploader.MEDIAN_SIZE, // Override from data object if avialble
		serverTime = dataObj.serverTime || PicUploader.SERVER_TIME, // Override from data object if avialble
		/**
		 * uploadRate determines the speed in which the progree meter should run
		 * based on the size of the image uploaded.
		 * 
		 * It is calculated based on a MEDIAN_TIME (in milliseconds) required for
		 * uploading an image of MEDIAN_SIZE size 
		 * 
		 * Median time for an image size MEDIAN_SIZE bytes is MEDIAN_TIME milliseconds
		 * uploadRate = MEDIAN_TIME / MEDIAN_SIZE (time / size)
		 *
		 * @property uploadRate
		 * @private
		 */	
		uploadRate = medianTime / medianSize,
		/**
		 * serverRate determines the speed in which server processes the image and
		 * sends a response
		 * 
		 * It is calculated based on a SERVER_TIME (in milliseconds) required for
		 * uploading an image of MEDIAN_SIZE size 
		 * 
		 * Median time for an image size MEDIAN_SIZE bytes is SERVER_TIME milliseconds
		 * serverRate = SERVER_TIME / MEDIAN_SIZE (time / size)
		 *
		 * @constant serverRate
		 * @private
		 */					
		serverRate = serverTime / medianSize,
		serverRatio = serverRate/uploadRate, // Get the server ratio from data object if available
		uploadRatio = 1 - serverRatio, // Upload ratio calculated from server ratio		
		/**
		 * Private static variables 
		 */	
		instance = this,
		d = document, 
		get = "getElementById", // Shortcut for document.getElementById to enable compression			
		imgLoadedState = 1, // Flag to maintain image loaded state. Default is 1 set to 0 when load failed
		index = dataObj.index, // The index assoicated with this instance
		uploadFormName = dataObj.uploadForm, // The form name to simulate AJAX
		uploadForm, // Local variable to cache form element
		fileObj = dataObj.file, // The file object in case present in the data object
		fileNameLayer = d[get](dataObj.fileNameLayer), // File name div
		progMeterLayer = d[get](dataObj.progressMeterLayer), // Progress Meter layer
		errorLayer = d[get](dataObj.errorLayer), // Error layer
		imageWrapper = d[get](dataObj.imageWrapper), // Image Wrapper
		controls = d[get](dataObj.controlsLayer), // controls layer
		overlay = d[get](dataObj.overlayLayer), // Overlay layer
		zoomImageLayer = d[get](dataObj.zoomLayer), // Zoom image layer
		maskLayer = dataObj.maskLayer, // mask layer
		finalCb = dataObj.finalCb, // Final callback to execute after upload complete
		deleteCb = dataObj.deleteCb, // Delete callback to call after user deletes an image
		primaryCb = dataObj.primaryCb, // Primary callback to call after user an image as primary
		serverURL = dataObj.serverURL || PicUploader.SERVER_URL, // Get the server URL for uploading the picture
		errorImage = dataObj.errorImage || PicUploader.ERROR_IMAGE, // Get the error Image to show for upload failures
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
		getInterval = function(size, rate, percentCompleted) {
			!rate && (rate = uploadRate);
			!percentCompleted && (percentCompleted = 0);
			// Getting it for the 90th percentile
			var interval = Math.abs((size * uploadRate)/(90 - percentCompleted));
			// If interval is less that 5ms then default it to 5ms
			// Due to clamping successive intervals DOM_CLAMP_TIMEOUT_NESTING_LEVEL 
			// https://developer.mozilla.org/en/DOM/window.setTimeout#Minimum_delay_and_timeout_nesting
			return interval < 5? 5: interval;
		},
		createImage = function(src, h, w) {
			var img = document.createElement('img');
			img.src = src;
			img.height = h;
			img.width = w;			
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
			var xhr = new XMLHttpRequest(),
				clientUploadDone = 0;
			
			xhr.upload.onprogress = function(e){
	            if (e.lengthComputable){
	            	// If client upload is done then server upload has started so return immediately
	            	if(clientUploadDone) {
	            		return;
	            	}
	            	var percentUpload = Math.round(Math.round(e.loaded / e.total * 100) * uploadRatio), // Multiply by upload ratio to get the exact count,
	            		uploadPercent = Math.round(uploadRatio * 100) - 1; // Subtracting 1 to since for small files after 99% the file is already uploaded
	            	if(percentUpload >= uploadPercent) {
	            		clientUploadDone = 1;
	            		// Start the progress meter based on server rate
	            		progMeter.start(getInterval(fileInfo.size, serverRate, uploadPercent));
	            	} else {
	            		progMeter.progress(percentUpload);
	            	}
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

		};
	
	// Set the file object for this instance	
	this.setFileObj = function(file) {
		fileObj = file;
		// If size not available set median size
		if(fileObj.size == 'NA') {
			fileObj.size = medianSize;
		}
	};
		
	this.upload = function() {
		
		var t = this,
		// Decide upload functionality based on browser support 
		uploadServer = fileObj.multiUpload? uploadAJAX: uploadIframe; // ALAX based approach or hidden Iframe based approach
		
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
			imgData = {error: err},
			that = this;
		
		if(err) {
			// Set the image date object
			imgData = {error: {thumbnailUrl: errorImage, title: err.msg || err}},
			// Set the error Image
			this.setPicture(imgData);
			// Call the final complete to set the state accordingly
			this.complete(res);
			// Set image loaded state to 0 since this is error scenario
			imgLoadedState = 0;	
			// Stop the progress meter and set to 0
			progMeter.stop();
			progMeter.progress(0);
			// Call the final callback
			finalCb && finalCb(index, imgData);			
		} else { // Success	
			// Set the image data object			
			imgData = {thumbnailUrl: res.data.thumbNail, mainUrl: res.data.mainUrl};
			// Load the image before completing the progress meter, so the images are shown seemlessly		
			// Hide the display to preserve the dimensions
			hide(imageWrapper, 1);
			// Set the thumbnail picture
			this.setPicture(imgData);
			
			// Create the canvas element
			//(canvasElem = document.createElement("canvas")) && imageWrapper.appendChild(canvasElem);				
		
			// Complete the progress meter with the callback which calls the final complete
			progMeter.complete(function(r) {
				return function() {
							that.complete(r);
							// Call the final callback
							finalCb && finalCb(index, imgData);
						};
				}(res));	
		}					
	};
	
	this.complete = function(res) {
		
		// Hide the file name
		hide(fileNameLayer);
		
		// Hide the progress meter layer
		hide(progMeterLayer);
		
		// Show the wrapper (both visibility & display) 
		show(imageWrapper);
		show(imageWrapper, 1);
		
		// Show only when mouse over
		// show(controls);	
	};
	
	this.setPicture = function(imgData) {
		if(imgData) {
			if(imgData.error) {
				// If error then set imgDate to error object
				imgData = imgData.error;
				// empty the zoom layer
				updateContent(zoomImageLayer, "");
			}
			// First handle thumbnail image
			if(thumbnailImage = imageWrapper.firstChild) { // Get the image if it is already created and set the source
				thumbnailImage.src = imgData.thumbnailUrl;	
			} else { // Create image and append
				imageWrapper.appendChild(thumbnailImage = createImage(imgData.thumbnailUrl, 131, 200));
			}			
			// Do the same for zoom image if mainUrl is present
			if(imgData.mainUrl) {
				if(zoomImageLayer.firstChild) { // Get the image if it is already created and set the source	
					zoomImageLayer.firstChild.src = imgData.mainUrl; 
				} else { // Create image and append
					zoomImageLayer.appendChild(createImage(imgData.mainUrl, 531, 800));
				}
			}
			// Adding the title for thumbnail image if present
			imgData.title && (thumbnailImage.title = imgData.title);				
		} else {
			// If src not present clean up the image wrapper and 
			updateContent(imageWrapper, "");	
			updateContent(zoomImageLayer, "");
		}
		// Update the image loaded state
		imgLoadedState = 1;		
	};
	
	this.deleteImage = function() {
		// Clear the image wrapper
		updateContent(imageWrapper, "");

		// Clear the zoom image layer
		updateContent(zoomImageLayer, "");
		
		// Reset the Progress Meter
		progMeter.progress(0);
				
		// Hide controls
		hide(controls);		
		
		// Call the delete callback if present
		deleteCb &&	deleteCb(index);	 
	};
	
	// This method currently acts as a facade to the callback function
	// Logic can be added if needed
	this.setPrimary = function() {
		// Call only if the image is uploaded
		if(imgLoadedState) {
			primaryCb && primaryCb(index);
		}
	};
	
	this.showControls = function() {
		imgLoadedState && imageWrapper.firstChild && show(controls);
	};
	
	this.hideControls = function() {
		imgLoadedState && imageWrapper.firstChild && hide(controls);
	};
	
	this.zoomImage = function() {			
		show(maskLayer, 1);
		show(overlay, 1);
	};
	
	this.closeOverlay = function() {
		hide(maskLayer, 1);
		hide(overlay, 1);			
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
	attach(d[get](dataObj.primaryControl), "click", function(){
		instance.setPrimary();
	});	
};
// Static Server URL
PicUploader.SERVER_URL = "upload.php";
// Static error image
PicUploader.ERROR_IMAGE = "no-pic-error.png";

/**
 * MEDIAN_SIZE property denotes median size of the images that users
 * upload. This is calculated based on history data or dry runs of the
 * picture manager. 
 * 
 * The more close to reality the value is the more acurate the progress
 * meter will function
 * 
 * Current value based on historic data is ~4MB 4046357 bytes, should be
 * overriden at application level as needed
 *
 * @property MEDIAN_SIZE
 * @static 
 * @public
 */	
PicUploader.MEDIAN_SIZE = 4046357;

/**
 * MEDIAN_TIME property denotes median time taken to uplod 1 image of MEDIAN_SIZE
 * to the server. This is calculated based on history data or dry runs of the
 * picture manager. 
 * 
 * The more close to reality the value is the more acurate the progress
 * meter will function
 * 
 * Current value based on local server date is 12000 milliseconds for MEDIAN_SIZE, 
 * Should be overriden at application level as needed
 *
 * @property MEDIAN_TIME
 * @override
 * @static 
 * @public
 */	
PicUploader.MEDIAN_TIME = 12000;

/**
 * Uploading an image to server has 2 parts
 * 	- Browser uploading the file to the server on HTTP
 *  - The server processing the file and either calling another webservice or
 *    doing some manupulation on them before serving
 * 
 * The file upload covers only the browser part of the equation and on investigation
 * it proves that servers take some time to process and store the image. 
 * 
 * SERVER_TIME accounts for that portion of equation, this can be overriden by the 
 * application.
 * 
 * *** SERVER_TIME SHOULD BE CALCULATED BASED ON MEDIAN_SIZE ***
 *
 * With a local setup the server time was about 80% (9600 milliseconds), but in real 
 * time the ratio will be different. 
 * 
 * @property SERVER_TIME
 * @override
 * @static 
 * @public
 */	
PicUploader.SERVER_TIME = 9600;
