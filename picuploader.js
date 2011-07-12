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
		d = document, 
		get = "getElementById", // Shortcut for document.getElementById to enable compression			
		imgLoadedState, // Flag to maintain image loaded state
		index = dataObj.index, // Current index status
		uploadForm = d[get](dataObj.uploadForm), // the page form to simulate AJAX
		file = d[get](dataObj.file), // The file input type
		fileNameLayer = d[get](dataObj.fileNameLayer), // File name div
		progMeterLayer = d[get](dataObj.progressMeterLayer), // Progress Meter layer
		addLayer = d[get](dataObj.addPicLayer), // Add picture link div
		errorLayer = d[get](dataObj.errorLayer), // Error layer
		imageWrapper = d[get](dataObj.imageWrapper), // Image Wrapper
		controls = d[get](dataObj.controlsLayer), // controls layer
		overlay = d[get](dataObj.overlayLayer), // Overlay layer
		zoomImageLayer = d[get](dataObj.zoomLayer), // Zoom image layer
		maskLayer = d[get](dataObj.maskLayer), // mask layer
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
		};
		
	this.upload = function() {
		
		var t = this,
			fileInfo = t.getFileInfo(); 
		
		// Hide the add picture link & error message if any
		hide(addLayer);
		hide(errorLayer);

		// Update the file name
		updateContent(fileNameLayer, fileInfo.name);			
		
		// Submit the form
		uploadForm.submit();	
		
		// Show the file name Layer
		show(fileNameLayer);
		
		// Show the progress bar
		show(progMeterLayer);
		
		// Start the progess meter
		progMeter.start(getInterval(fileInfo.size));
	};
	
	this.handleResponse = function(res) {
		// Get error message if any
		var err = !res? "No response from server. Try again": res.error,
			img,
			that = this;
		
		if(err) {
			updateError(err.msg); // Update error
			show(addLayer); // Show add link again
		} else { // Success	
			// Load the image before completing the progress meter, so the images are shown seemlessly		
			// Hide the display to preserve the dimensions
			hide(imageWrapper, 1);
			// Clear the image wrapper first
			updateContent(imageWrapper, "");				
			// Create and add the image
			imageWrapper.appendChild(thumbnailImage = createImage(res.data.picURL, 131, 200));
			// Create the canvas element
			(canvasElem = document.createElement("canvas")) && imageWrapper.appendChild(canvasElem);				
			
			// Complete the progress meter with the callback
			progMeter.complete(function(r) {
				return function() {
							that.complete(r);
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
		
		// Show the controls
		show(controls);
		
		// Create image in zoom overlay
		updateContent(zoomImageLayer, "");
		zoomImageLayer.appendChild(createImage(res.data.picURL, 531, 800));
		
		// Update the image loaded state
		imgLoadedState = 1;			
	};
	
	this.getFileInfo = function() {
		var current;
		
		try {			
			current = file.files[index];
		} catch(e) {
			// TODO find a good way to get file size in IE
			current = {fileName: "test", size: 2000000};
		}
					
		return {name: current.fileName,
				size: current.size};
	};
	
	this.deleteImage = function() {
		
		// Clear the image wrapper
		updateContent(imageWrapper, "");
		
		// Reset the Progress Meter
		progMeter.progress(0);
		
		// Show add image layer
		show(addLayer);
		
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
};

var picUploader = new PicUploader({
		uploadForm: "file_upload_form", 
		file: "file", 
		fileNameLayer: "fileName", 
		progressMeterLayer: "progressMeter",
		progressLayer: "progress",
		percentLayer: "percentage",
		addPicLayer: "add", 
		errorLayer: "error",
		imageWrapper: "imageWrapper",
		controlsLayer: "controls",
		overlayLayer: "overlay",
		zoomLayer: "enlarge",
		maskLayer: "mask",
		index: 0
		});