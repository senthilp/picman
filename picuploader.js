/**
 * PicUploader is the main engine class for the PicMan application. The class
 * implements the AJAX based picture uploader and also triggers/controls the
 * ProgressMeter instance. 
 * 
 * The PicUploader uses the HTML5 File API based upload with real time status 
 * from the XMLHttpRequest upload 'progress' listener in browsers that support 
 * it and uses iframe single file upload apprach in non-supporting browsers thus 
 * simulating AJAX. 
 * 
 * PicUploader also binds the various events associted with the controls 
 * dashboard for every image. The operations supported are zoom, making primary
 * and delete. 
 * 
 * In order to provide progess meter feedback even to browsers that doesn't 
 * support the 'progress' listener the PicUploader requires 2 static values 
 * (MEDIAN_TIME & MEDIAN_SIZE) to be set. See setailed documentation below.  
 * 
 * @class PicUploader
 * @constructor
 * @param {Object} dataObj A data object encapsulating all the input paramaters
 * 						   required for the PicUploader	
 * 
 */
function PicUploader(dataObj){ 
	/**
	 * Private static variables 
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
		u = Utils, // Utils object reference
		imgLoadedState = 1, // Flag to maintain image loaded state. Default is 1 set to 0 when load failed
		isPrimary, // Flag hold the primary state of image
		index = dataObj.index, // The index assoicated with this instance
		uploadFormName = dataObj.uploadForm, // The form name to simulate AJAX
		uploadForm, // Local variable to cache form element
		fileObj = dataObj.file, // The file object in case present in the data object
		fileNameLayer = d[get](dataObj.fileNameLayer), // File name div
		progMeterLayer = d[get](dataObj.progressMeterLayer), // Progress Meter layer
		imageWrapper = d[get](dataObj.imageWrapper), // Image Wrapper
		controls = d[get](dataObj.controlsLayer), // controls layer
		overlay = d[get](dataObj.overlayLayer), // Overlay layer
		zoomImageLayer = d[get](dataObj.zoomLayer), // Zoom image layer
		maskLayer = dataObj.maskLayer, // mask layer
		primaryControl = dataObj.primaryControl, // Primary control div
		finalCb = dataObj.finalCb, // Final callback to execute after upload complete
		deleteCb = dataObj.deleteCb, // Delete callback to call after user deletes an image
		primaryCb = dataObj.primaryCb, // Primary callback to call after user an image as primary
		serverURL = dataObj.serverURL || PicUploader.SERVER_URL, // Get the server URL for uploading the picture
		errorImage = dataObj.errorImage || PicUploader.ERROR_IMAGE, // Get the error Image to show for upload failures
		progMeter = new ProgressMeter({progressLayer: dataObj.progressLayer, percentLayer: dataObj.percentLayer}), // creating Progress Meter Object instance
		thumbnailImage, // Thumbnail image element 	    
		/**
	     * Given a file size returns the time interval to run the progress meter.
	     * Takes 2 optional parameters rate & percentCompleted to determine the 
	     * interval accordingly.
	     * 
	     * If rate is not provided, the uploadRate is used and the overall percentage
	     * is targeted at 90%. The last 10% is used for JS activities like setting image 
	     * soure etc.
	     * 
	     * 
	     * @method getInterval 
	     * @param {Number} size The size of file that is uploaded
	     * @param {rate} rate An optional rate for which the interval should be calculated
	     * @param {percentCompleted} percentCompleted If there is already a percentage the 
	     * 						     ProgressMeter is completed this parameter can be used to
	     * 							 specify that  	
	     * @private
	     */			
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
		/**
	     * Evaluates and returns the content of the given iframe. 
	     * 
	     * @method getIframeResponse 
	     * @param {Object} iframe The iframe DOM element
	     *   	
	     * @private
	     */			
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
		/**
	     * Implements the HTML5 based AJAX file upload  
	     * 
	     * @method uploadAJAX 
	     * @param {Object} fileInfo The object encapsulating the details of the file  
	     * @param {Function} cb The callback function to call after file is uploaded
	     * 
	     * @private
	     */					
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
		/**
	     * Implements the iframe based file upload
	     * 
	     * @method uploadIframe 
	     * @param {Object} fileInfo The object encapsulating the details of the file  
	     * @param {Function} cb The callback function to call after file is uploaded
	     * 
	     * @private
	     */			
		uploadIframe = function(fileInfo, cb) {
			var iframe = u.createIframe(fileInfo.name);
			!uploadForm && (uploadForm = d[get](uploadFormName)); 
			uploadForm.setAttribute('target', iframe.name);
			u.attach(iframe, 'load', function() {
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
	
	/**
     * Sets the file object to be uploaded to the local variable
     * 
     * @method setFileObj 
     * @param {Object} file The object encapsulating the details of the file to be uploaded  
     * 
     * @public
     */			
	this.setFileObj = function(file) {
		fileObj = file;
		// If size not available set median size
		if(fileObj.size == 'NA') {
			fileObj.size = medianSize;
		}
	};

	/**
     * Upload the image file to the back server based on browser compatability
     * 
     * @method upload 
     * @param {Object} file An optional object encapsulating the details of the file to be uploaded          
     * 						If not provided uses the file set using the setFileObj method or passed
     * 						in dataObj during creation
     * @public
     */		
	this.upload = function(file) {
		
		//Set the file object if present
		file && this.setFileObj(file);
		
		var t = this,
		// Decide upload functionality based on browser support 
		uploadServer = fileObj.multiUpload? uploadAJAX: uploadIframe; // AJAX based approach or hidden Iframe based approach
		
		// Update the file name
		u.updateContent(fileNameLayer, fileObj.name);			
		
		// Show the file name Layer
		u.show(fileNameLayer);
		
		// Show the progress bar
		u.show(progMeterLayer);
				
		uploadServer(fileObj, function(res) {
			t.handleResponse(res);
		});
	};

	/**
     * Handles the response from the backend server after uploading the image 
     * 
     * @method handleResponse 
     * @param {Object} res The JSON response object from server
     * 
     * @public
     */			
	this.handleResponse = function(res) {
		// Get error message if any
		var err = !res? "No response from server. Try again": res.error,
			imgData,
			that = this;
		
		if(err) {
			//Set image data
			imgData = {error: err};
			// Set the error content
			imageWrapper.innerHTML = '<div class="error">' + err.msg || err + '</div>';
			// Stop the progress meter
			progMeter.stop();
			// Call the final complete to set the state accordingly
			this.complete();
			// Set image loaded state to 0 since this is error scenario
			imgLoadedState = 0;	
			// Call the final callback
			finalCb && finalCb(index, imgData);			
		} else { // Success	
			// Set the image data object			
			imgData = {thumbnailUrl: res.data.thumbNail, mainUrl: res.data.mainUrl};
			// Load the image before completing the progress meter, so the images are shown seemlessly		
			// Hide the display to preserve the dimensions
			u.hide(imageWrapper, 1);
			// Set the thumbnail picture
			this.setPicture(imgData);		
			// Complete the progress meter with the callback which calls the final complete
			progMeter.complete(function(r) {
				return function() {
							that.complete();
							// Call the final callback
							finalCb && finalCb(index, imgData);
						};
				}(res));	
		}					
	};

	/**
     * Completes the image upload by doing the final wrapup operations  
     * 
     * @method complete 
     * 
     * @public
     */		
	this.complete = function() {
		
		// Hide the file name
		u.hide(fileNameLayer);
		
		// Hide the progress meter layer
		u.hide(progMeterLayer);
		
		// Show the wrapper (both visibility & display) 
		u.show(imageWrapper);
		u.show(imageWrapper, 1);
		
		// Set progress meter to 0
		progMeter.progress(0);
	};
	
	/**
     * Sets the thumbnail and zoom images in their associated containers
     * Optimized to create a new img element only if not already created 
     * 
     * @method setPicture 
     * @param {Object} imgData Object encapsulating the details of the pciture URLs
     * 
     * @public
     */		
	this.setPicture = function(imgData) {
		if(imgData) {
			// First handle thumbnail image
			if((thumbnailImage = imageWrapper.firstChild) && thumbnailImage.tagName.toUpperCase() == "IMG") { // Get the image if it is already created and set the source
				thumbnailImage.src = imgData.thumbnailUrl;	
			} else { // Create image and append
				u.updateContent(imageWrapper, ""); // Clear the content first 
				imageWrapper.appendChild(thumbnailImage = u.createImage(imgData.thumbnailUrl, 131, 200));
			}			
			// Do the same for zoom image
			if(zoomImageLayer.firstChild) { // Get the image if it is already created and set the source	
				zoomImageLayer.firstChild.src = imgData.mainUrl; 
			} else { // Create image and append
				zoomImageLayer.appendChild(u.createImage(imgData.mainUrl, 531, 800));
			}
		
		} else {
			// If src not present clean up the image wrapper and 
			u.updateContent(imageWrapper, "");	
			u.updateContent(zoomImageLayer, "");
		}
		// Update the image loaded state
		imgLoadedState = 1;		
	};

	/**
     * Deletes the image by cleaning the wrapper containers of both thumbnail and
     * zoom images.  
     * TODO make AJAX call to delete the image from the server
     * 
     * @method deleteImage 
     * 
     * @public
     */			
	this.deleteImage = function() {
		// Clear the image wrapper
		u.updateContent(imageWrapper, "");

		// Clear the zoom image layer
		u.updateContent(zoomImageLayer, "");
		
		// Reset the Progress Meter
		progMeter.progress(0);
				
		// Hide controls
		u.hide(controls);		
		
		// Call the delete callback if present
		deleteCb &&	deleteCb(index);	 
	};


	/**
     * Shows the dashboard controls based on image loaded state  
     * 
     * @method showControls 
     * 
     * @public
     */		
	this.showControls = function() {
		imgLoadedState && imageWrapper.firstChild && u.show(controls);
	};

	/**
     * Hides the dashboard controls based on image loaded state  
     * 
     * @method hideControls 
     * 
     * @public
     */		
	this.hideControls = function() {
		imgLoadedState && imageWrapper.firstChild && u.hide(controls);
	};

	/**
     * Shows the enlarged image in an overlay 
     * 
     * @method zoomImage 
     * 
     * @public
     */		
	this.zoomImage = function() {			
		u.show(maskLayer, 1);
		u.show(overlay, 1);
	};

	/**
     * Closes the zoom image overlay
     * 
     * @method closeOverlay 
     * 
     * @public
     */			
	this.closeOverlay = function() {
		u.hide(maskLayer, 1);
		u.hide(overlay, 1);			
	};

	/**
     * Makes the image assicated with the instance as primary
     * The primary callback function takes care of resetting the primary style
     * in the remaining images
     * 
     * TODO make AJAX call to server and make the image primary
     * 
     * @method setPrimary 
     * 
     * @public
     */		
	this.setPrimary = function() {
		if(imgLoadedState) {
			// Set the primary Class and set sttribute
			u.addClass(imageWrapper, "primary");	
			// Set primary flag
			isPrimary = 1;
			// Hide the primary control
			u.hide(d[get](primaryControl), 1);
			// Call the primary callback if available
			primaryCb && primaryCb(index);
		}
	};

	/**
     * Removes the primary styling from the image assicated with the instance
     * 
     * @method removePrimary 
     * 
     * @public
     */			
	this.removePrimary = function() {
		//Remove primary Class
		u.removeClass(imageWrapper, "primary");
		// Reset primary flag		
		isPrimary = 0;
		// Show the primary control
		u.show(d[get](primaryControl), 1);					
	};

	/**
     * Returns true|1 if the instance is the primary image 
     * 
     * @method isPrimary 
     * 
     * @public
     */		
	this.isPrimary = function() {
		return isPrimary;
	};
	
	// Bind events
	u.attach(d[get](dataObj.picContainer), "mouseover", function(){
		instance.showControls();
	});
	u.attach(d[get](dataObj.picContainer), "mouseout", function(){
		instance.hideControls();
	});
	u.attach(d[get](dataObj.closeZoomLink), "click", function(){
		instance.closeOverlay();
		return false;
	});
	u.attach(d[get](dataObj.zoomControl), "click", function(){
		instance.zoomImage();
	});
	u.attach(d[get](dataObj.deleteControl), "click", function(){
		instance.deleteImage();
	});
	u.attach(d[get](dataObj.primaryControl), "click", function(){
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
