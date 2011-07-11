var PicManager = function(){ 
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
		imgLoadedState = [], // Hash to maintain image loaded state
		currIndex, // Current index status
		uploadForm = d[get]("file_upload_form"), // the main page form
		file = d[get]("file"), // The file input type
		fileNameLayer = d[get]("fileName"), // File name div
		progMeterLayer = d[get]("progressMeter"), // Progress Meter layer
		addLayer = d[get]("add"), // Add picture link div
		errorLayer = d[get]("error"), // Error layer
		imageWrapper = d[get]("imageWrapper"), // Image Wrapper
		controls = d[get]("controls"), // controls layer
		overlay = d[get]("overlay"), // Overlay layer
		zoomImageLayer = d[get]("enlarge"), // Zoom image layer
		maskLayer = d[get]("mask"), // mask layer
		progMeter = new ProgressMeter({progressLayer: "progress", percentLayer: "percentage"}), // creating Progress Meter Object instance
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
		
	return {
		upload: function(index) {
			
			var t = this,
				fileInfo = t.getFileInfo(index); 
			
			// Set current index
			currIndex = index;
			
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
		},
		
		handleResponse: function(res) {
			// Get error message if any
			var err = !res? "No response from server. Try again": res.error,
				img;
			
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
								PicManager.complete(r);
							};
					}(res));
			}			
		},
		
		complete: function(res) {
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
			imgLoadedState[currIndex] = 1;			
		},
		
		getFileInfo: function(index) {
			var current;
			
			try {			
				current = file.files[index];
			} catch(e) {
				// TODO find a good way to get file size in IE
				current = {fileName: "test", size: 2000000};
			}
						
			return {name: current.fileName,
					size: current.size};
		},
		
		deleteImage: function(index) {
			
			// Clear the image wrapper
			updateContent(imageWrapper, "");
			
			// Reset the Progress Meter
			progMeter.progress(0);
			
			// Show add image layer
			show(addLayer);
			
			// Hide controls
			hide(controls);
			
			// Reset the image loaded state
			imgLoadedState[currIndex] = 0;
		},
		
		showControls: function(index) {
			typeof imgLoadedState[index] !== 'undefined' && imgLoadedState[index] && show(controls);
		},
		
		hideControls: function(index) {
			typeof imgLoadedState[index] !== 'undefined' && imgLoadedState[index] && hide(controls);
		},
		
		zoomImage: function(index) {			
			show(maskLayer, 1);
			show(overlay, 1);
		},
		
		closeOverlay: function(index) {
			hide(maskLayer, 1);
			hide(overlay, 1);			
		},
		
		rotateLeft: function() {
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
		}
		
	};
}();
