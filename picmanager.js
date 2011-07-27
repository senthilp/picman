var PicManager = function() {
	var d = document,
		get = "getElementById",
		MAX_LIMIT, // Max number of files allowed to be uploaded
		picManConfig, // Pic man config bean
		file, // File browse HTML element
		primaryIndex, // Index to denote primary Image
		maskLayer, // Mask Layer
		addLayer, // Add file Layer
		startIndex = 0, // Static closure variable to maintain the start index when file upload
		inProgress = 0, // Flag to indicate if Pic Manager in working
		imageHash = [], // Hash to hold the image list in order
		imageWrapperCache = [], // A cache to hold the images
		picUploaderHash = [], // Hash to hold the pic uploader instances
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
		createImage = function(src, h, w) {
			var img = document.createElement('img');
			img.src = src;
			img.height = h;
			img.width = w;
			return img;
		},		
		attach = function(element, type, fn) {
		    if (element.addEventListener){
		        element.addEventListener(type, fn, false);
		    } else if (element.attachEvent){
		        element.attachEvent('on' + type, fn);
		    }			
		},	
		addClass = function(elem, className) {
			elem.className = elem.className + " " + className;
		},
		removeClass = function(elem, className) {
			var pattern = new RegExp(" " + className, "g");
			elem.className = elem.className.replace(pattern, "");
		},
		getImageWrapper = function(index) {
			var id = picManConfig.image.imageWrapper + index,
				imageWrapper;
			// Check in the cahce first
			if(!(imageWrapper = imageWrapperCache[id])) {
				imageWrapper = d[get](id);
				imageWrapperCache[id] = imageWrapper;
			}
			return imageWrapper;
		}, 
		getFileList = function() {
			var fileList, i, l, current;
			
			if(!file ) {
				fileList = {error: "No file found"};
			} else if(file.files && ((file.files.length + startIndex) > MAX_LIMIT)) {
				fileList = {error: "Maximum of only " + MAX_LIMIT + " images allowed. Please select accordingly"};
			} else {
				fileList = [];
				if(PicManager.isMultiUploadSupported && file.files) {
					for(i=0, l=file.files.length; i < l; i++) {
						current = file.files[i];
						fileList.push({file: current, name: current.name || current.fileName, size: current.size, multiUpload: 1});
					}
				} else {
					// IE 7 & 8 which does not support multi file upload
					// Set size as mdedian 4MB					
					fileList.push({file: file, name: file.value.replace(/.*(\/|\\)/, ""), size: 4046357, multiUpload: 0});
				}
			}
			
			return fileList;
		},
		activateDropbox = function(dropBoxDiv) {
			var elem = d[get](dropBoxDiv),	
				pm = PicManager,
				exitFlag, // To control the dragLeave event, this will be set only if dragEnter is not called before drag leave 
				// Always call  No Operation handler events events first
				noOpHandler = function(evt) {
					evt.stopPropagation();
					evt.preventDefault();
				},				
				dragEnter = function(evt) {		
					// Prevent defaults					
					noOpHandler(evt);
					// Reset exit flag
					exitFlag = 0;
					// Highlight border
					addClass(elem, "dragenter");					
				},
				dragLeave = function(evt) {
					// Prevent defaults
					noOpHandler(evt);
					// remove border highlight if exit flag is set
					exitFlag && removeClass(elem, "dragenter");
					exitFlag = 1;
				},
				dragExit = function(evt) {
					// Prevent defaults
					noOpHandler(evt);
					// remove border highlight
					removeClass(elem, "dragenter");
				},
				drop = function(evt) {
					// Prevent defaults
					noOpHandler(evt);
					
					// If in progress then just return
					if(inProgress) {
						return;
					}
					
					// Start the upload
					file = evt.dataTransfer;
					pm.upload();
					// remove border highlight
					removeClass(elem, "dragenter");					
				};
			
			// Show the box
			addClass(elem, "activate");	
			
			// Attach drag events
			attach(elem, "dragenter", dragEnter);
			attach(elem, "dragleave", dragLeave); 
			attach(elem, "dragexit", dragExit); // For FF < 3.5
			attach(elem, "dragover", noOpHandler);
			
			// Attach the drop event
			attach(elem, "drop", drop);
			attach(elem, "dragdrop", drop); // For FF < 3.5
		};
	
	return {
		init: function(config) {
			// Setting the private static variables 
			picManConfig = config;
			addPicLayer = d[get](picManConfig.addPicLayer);
			maskLayer = d[get](picManConfig.maskLayer);
			MAX_LIMIT = picManConfig.MAX_LIMIT;
			primaryIndex = picManConfig.primaryIndex;			
			// File related operations
			var t = this, fileElem = d[get](picManConfig.file);
			// Setting multiple attribute only if supported
			if(PicManager.isMultiUploadSupported) {
				fileElem.setAttribute("multiple", "multiple");
				// Activate the drop box & show the drop text
				activateDropbox(picManConfig.dropBox);
				show(d[get](picManConfig.dropText));
			}
			// Attaching on change event 
			attach(fileElem, "change", function() {
				// If in progress then just return
				if(inProgress) {
					return;
				}
				
				file = fileElem;
				t.upload();
			});
		},
		
		upload: function() {
			var fileList = getFileList(), 
				picUploader, 
				localindex = startIndex, 
				counter = 0, // counter incremented on each file upload
				length, // count on the number of files for this upload
				that = this, // Getting the singleton instance
				i;			
			
			// Check for errors first
			if(fileList.error) {
				alert(fileList.error);
				return;
			}
			
			// Hide the app pic layer
			hide(addPicLayer);
			
			// Set in progress flag
			inProgress = 1; 
			
			// Create and bind picuploader instances 
			for(i=0, length=fileList.length; i<length; i++) {
				// Check the hash first then create an instance
				if(!(picUploader = picUploaderHash[localindex])) {
					picUploader = new PicUploader({
						index: localindex,
						uploadForm: picManConfig.uploadForm,
						serverURL: picManConfig.serverURL,
						maskLayer: maskLayer,
						file: fileList[i], 
						fileNameLayer: picManConfig.image.fileNameLayer + localindex, 
						progressMeterLayer: picManConfig.image.progressMeterLayer + localindex,
						progressLayer: picManConfig.image.progressLayer + localindex,
						percentLayer: picManConfig.image.percentLayer + localindex,
						errorLayer: picManConfig.image.errorLayer + localindex,
						imageWrapper: picManConfig.image.imageWrapper + localindex,
						controlsLayer: picManConfig.image.controlsLayer + localindex,
						overlayLayer: picManConfig.image.overlayLayer + localindex,
						zoomLayer: picManConfig.image.zoomLayer + localindex,
						picContainer: picManConfig.image.picContainer + localindex,
						closeZoomLink: picManConfig.image.closeZoomLink + localindex,
						zoomControl: picManConfig.image.zoomControl + localindex,
						primaryControl: picManConfig.image.primaryControl + localindex,
						deleteControl: picManConfig.image.deleteControl + localindex,					
						finalCb: function(index, imgData) {
							startIndex++;
							counter++;
							imageHash[index] = imgData;
							if(counter == length) {
								show(addPicLayer);
								inProgress = 0;
								// Set primary if primaryIndex = 0 
								primaryIndex == 0 && that.setPrimary();
							}
						},
						deleteCb: function(index) {
							// Remove image from hash
							that.removeImageHash(index);
							// Do a reflow
							that.reflow();
						},
						primaryCb: function(index) {
							// Set primary
							that.setPrimary(index);
						}
					}); 
					picUploaderHash[i] = picUploader;
				} 
				picUploader.upload();	
				localindex++;
			}
		},	
		getImageHash: function() {
			return imageHash;
		},
		removeImageHash: function(index) {
			if(primaryIndex == index) {// Check if index to be removed is Primary index, then first image becomes primary
				primaryIndex = 0;
			} else if(primaryIndex > index) {// If primary index is greater than removed index, then reduce by 1 since it will be shifted to left
				primaryIndex--;
			}
			imageHash = imageHash.slice(0, index).concat(imageHash.slice(index + 1));
		},
		setPrimary: function(index) {
			var imageWrapper;
			if(typeof index != "undefined" && primaryIndex != index) {
				//Remove primary Class
				this.removePrimary(primaryIndex);
				primaryIndex = index;
			}
			imageWrapper = getImageWrapper(primaryIndex);
			// Set the primary Class and set sttribute
			addClass(imageWrapper, "primary");			
			imageWrapper.isPrimary = 1;
			// Hide the primary control
			hide(d[get](picManConfig.image.primaryControl + primaryIndex), 1);
		},
		removePrimary: function(index) {
			var imageWrapper;
			// Set index to primary if not passed
			if(!index) {
				index = primaryIndex;
			}
			imageWrapper = getImageWrapper(index);
			//Remove primary Class and reset sttribute
			removeClass(getImageWrapper(index), "primary");
			imageWrapper.isPrimary = 0;
			// Hide the primary control
			show(d[get](picManConfig.image.primaryControl + index), 1);			
		},
		reflow: function() {
			var imageWrapper,
				img,
				src,
				i=0, 
				l=startIndex;  
			for(; i<l; i++) {
				// Get image wrapper from cache
				imageWrapper = getImageWrapper(i);	

				// Remove the primary from the wrapper
				imageWrapper.isPrimary && this.removePrimary(i);							
				
				if(typeof imageHash[i] == "undefined") { // Check if present in hash else set the content as empty
					imageWrapper.innerHTML = "";
				} else { 
					src = imageHash[i].error? "": imageHash[i].mainUrl;
					if(img = imageWrapper.firstChild) { // Get the image and set the source
						// TODO set error image URL and set Thumbnail URL accordingly
						img.src=src;	
					} else { // Create image and append
						imageWrapper.appendChild(createImage(src, 131, 200));
					}
				}
			}
			// Reset start index
			startIndex = imageHash.length;
			// If there is Image then set Primary
			startIndex && this.setPrimary();
		},
		isMultiUploadSupported: function(){
			var input = document.createElement("input");
			input.type = "file";
			
			return ('multiple' in input &&
					typeof File != "undefined" &&
					typeof (new XMLHttpRequest()).upload != "undefined");
		}()		
	};
}();