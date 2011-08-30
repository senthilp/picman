/**
 * PicManager is the centralized singleton manager class of the PicMan application 
 * controlling the user interface for uploading images, managing the Picture Uploader 
 * instances and maintaining the state of the application during various operations.
 * 
 * Primary tasks include
 * 	1. Modernizr - Activates the UI for drag & drop and multi-file select based on 
 * 				   browser support and fallback to basic single file browse upload
 * 				   for older browsers
 * 	2. File Validation - Validates the selected file type to be only images and also  
 * 						 not to exceed the max limit
 * 	3. Normalization - Normalizes the user selected files, creating a file object
 * 					   list encapsulating the various file attributes that PicUploader
 * 			           understands
 *  4. Creates and manages the PicUploader instances
 *  5. Maintian the application states during all the above operations
 * 
 * @class PicUploader
 * @singleton
 * 
 */
var PicManager = function() {
	var FILE_TYPE_MATRIX = {
			"jpeg": 1,
			"jpg": 1,
			"tif": 1,
			"png": 1,
			"bmp": 1,
			"gif": 1
		},
		d = document,
		get = "getElementById",
		u = Utils, // Utils object reference
		MAX_LIMIT, // Max number of files allowed to be uploaded
		picManConfig, // Pic man config bean
		file, // File browse HTML element
		primaryIndex, // Index to denote primary Image
		maskLayer, // Mask Layer
		addLayer, // Add file Layer
		startIndex, // Static closure variable to maintain the start index when file upload
		inProgress = 0, // Flag to indicate if Pic Manager in working
		selectedFilesCount, // Static closure to hold the selected files count on each upload
		fileCounter, // Static closure to keep count of the files uploaded
		imageHash = [], // Hash to hold the image list in order
		picUploaderHash = [], // Hash to hold the pic uploader instances	
		/**
	     * Cleans the local imageHash map by removing the error entries, errors that
	     * happened when uploading an image  
	     * 
	     * @method cleanImageHash 
	     *   	
	     * @private
	     */	
		cleanImageHash = function() {
			var i = 0,
				count = 0,
				index = 0,
				l = imageHash.length,
				tempHash =[];
			
			for(; i<l; i++) {
				// Add to tempHash if not error
				if(!imageHash[i].error) {
					tempHash[count++] = imageHash[i];
				} else if(primaryIndex > i) {// If primary index is greater than removed index, increment index
					index++;
				}
			}			
			// tempHash becomes the main imageHash			
			imageHash = tempHash;
			// Reduce the index from the primaryIndex
			primaryIndex -= index;
		},
		/**
	     * Checks the file type of the given fileName by verifying the file name
	     * extension. the extension should be present in the FILE_TYPE_MATRIX
	     * 
	     * @method checkFileType 
	     * @param {String} fileName The name of the file to be uploaded
	     * 
	     * @private
	     */			
		checkFileType = function(fileName) {
			if(!fileName) {
				return;
			}
			var ext = fileName.match(/\.([^\.]+)$/);
			return ext && ext[1]? FILE_TYPE_MATRIX[ext[1].toLowerCase()]: 1;
		},
		/**
	     * Normalizes the file HTML element by creating a file object list with 
	     * various file attributes. For browsers which do not support Multi
	     * file selection a list with 1 file object is created. 
	     * 
	     * In case of any errors an error object is returned
	     * 
	     * @method getFileList 
	     * 
	     * @private
	     */			
		getFileList = function() {
			var fileList, i, l, current, fileName, fileTypeError;
			
			if(!file ) {
				fileList = {error: "No file found"};
			} else if(file.files && ((file.files.length + startIndex) > MAX_LIMIT)) {
				fileList = {error: "Maximum of only " + MAX_LIMIT + " images allowed. Please select accordingly"};
			} else {
				fileList = [];
				if(PicManager.isMultiUploadSupported && file.files) {
					for(i=0, l=file.files.length; i < l; i++) {
						current = file.files[i];
						fileName = current.name;
						// Check the file type
						if(!checkFileType(fileName)) {
							fileTypeError = true;
							break;
						}
						// If file size is empty do not add to file list
						if(!current.size) {
							continue;
						}
						fileList.push({file: current, name: fileName || current.fileName, size: current.size, multiUpload: 1});
					}
				} else {	
					fileName = file.value.replace(/.*(\/|\\)/, "");
					// Check the file type
					if(checkFileType(fileName)) {
						// IE 7 & 8 which does not support multi file upload
						// Set size as NA, since not known					
						fileList.push({file: file, name: fileName, size: 'NA', multiUpload: 0});						
					} else {
						fileTypeError = true;
					}
				}
			}
			// If file type error set the error accordingly
			if(fileTypeError) {
				fileList = {error: "File type not supported. Only image types \"jpeg, jpg, tif, png, gif, bmp\""};
			} 
			
			return fileList;
		},
		/**
	     * Activates the drop box by attaching various drag/drop events and changing
	     * the drop box style
	     * 
	     * @method activateDropbox 
	     * @param {String} dropBoxDiv The id of the drop box div element
	     * 
	     * @private
	     */				
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
					u.addClass(elem, "dragenter");
				},
				dragLeave = function(evt) {
					// Prevent defaults
					noOpHandler(evt);
					// remove border highlight if exit flag is set
					exitFlag && u.removeClass(elem, "dragenter");						
					exitFlag = 1;
				},
				dragExit = function(evt) {
					// Prevent defaults
					noOpHandler(evt);
					// remove border highlight
					u.removeClass(elem, "dragenter");
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
					u.removeClass(elem, "dragenter");					
				};
			
			// Show the box
			u.addClass(elem, "activate");	
			
			// Attach drag events
			u.attach(elem, "dragenter", dragEnter);
			u.attach(elem, "dragleave", dragLeave); 
			u.attach(elem, "dragexit", dragExit); // For FF < 3.5
			u.attach(elem, "dragover", noOpHandler);
			
			// Attach the drop event
			u.attach(elem, "drop", drop);
			u.attach(elem, "dragdrop", drop); // For FF < 3.5
		},
		/**
	     * Check if any of the uploaded image is a primary image and if so apply 
	     * the primary image style
	     * 
	     * @method checkForPrimary 
	     * 
	     * @private
	     */			
		checkForPrimary = function() {
			if(picUploaderHash[primaryIndex] && !picUploaderHash[primaryIndex].isPrimary()) {
				if(imageHash[primaryIndex].error) {
					if(++primaryIndex < startIndex) {
						// Recursively call checkForPrimary again 
						checkForPrimary();
					}					
				} else {
					picUploaderHash[primaryIndex].setPrimary();
				}
			}
		},
		/**
	     * Creates a PicUploader instance for the given index and adds the instance
	     * to the picUploaderHash. The instance is created only if not available in
	     * the hash for that index
	     * 
	     * @method createPicuploader 
	     * @param {Number} index The index position of the image 
	     * 
	     * @private
	     */	
		createPicuploader = function(index) {
			var picUploader = picUploaderHash[index];
			// Check the hash first then create an instance
			if(!picUploader) {
				picUploader = new PicUploader({
					index: index,
					uploadForm: picManConfig.uploadForm,
					serverURL: picManConfig.serverURL,
					errorImage: picManConfig.errorImage,
					maskLayer: maskLayer,
					fileNameLayer: picManConfig.image.fileNameLayer + index, 
					progressMeterLayer: picManConfig.image.progressMeterLayer + index,
					progressLayer: picManConfig.image.progressLayer + index,
					percentLayer: picManConfig.image.percentLayer + index,
					imageWrapper: picManConfig.image.imageWrapper + index,
					controlsLayer: picManConfig.image.controlsLayer + index,
					overlayLayer: picManConfig.image.overlayLayer + index,
					zoomLayer: picManConfig.image.zoomLayer + index,
					picContainer: picManConfig.image.picContainer + index,
					closeZoomLink: picManConfig.image.closeZoomLink + index,
					zoomControl: picManConfig.image.zoomControl + index,
					primaryControl: picManConfig.image.primaryControl + index,
					deleteControl: picManConfig.image.deleteControl + index,					
					finalCb: function(index, imgData) {
						startIndex++;
						fileCounter++;
						imageHash[index] = imgData;
						if(fileCounter == selectedFilesCount) {
							// Show add pic layer only if files upload less than MAX_LIMIT
							(startIndex < MAX_LIMIT) && u.show(addPicLayer);
							// Remove the mash
							u.hide(maskLayer, 1);
							inProgress = 0;
							// Check for primary status 
							checkForPrimary();
						}
					},
					deleteCb: function(index) {
						// Remove image from hash
						PicManager.removeImageHash(index);
						// Do a reflow
						PicManager.reflow();
						// Show add layer if # of images less than MAX_LIMIT
						(startIndex < MAX_LIMIT) && u.show(addPicLayer);
					},
					primaryCb: function(index) {
						// Set primary
						PicManager.setPrimary(index);
					}
				}); 
				picUploaderHash[index] = picUploader;
			} 		
			return picUploader;
		};
	
	return {
		/**
	     * Initializes the PicManager application with the given input config object.
	     * It also creates the PicUploader instances for images which are already 
	     * present on page load and adjusts the starting index accordingly
	     * 
	     * @method init 
	     * @param {Object} config The input config object for the PicMan application 
	     * 
	     * @public
	     * @static
	     */		
		init: function(config) {
			// Setting the private static variables 
			picManConfig = config;
			addPicLayer = d[get](picManConfig.addPicLayer);
			maskLayer = d[get](picManConfig.maskLayer);
			MAX_LIMIT = picManConfig.MAX_LIMIT;
			primaryIndex = picManConfig.primaryIndex || 0;	
			startIndex = picManConfig.startIndex || 0;
			// Overriding the PicUploader static attributes based on config
			picManConfig.medianTime && (PicUploader.MEDIAN_TIME = picManConfig.medianTime);
			picManConfig.medianSize && (PicUploader.MEDIAN_SIZE = picManConfig.medianSize);
			picManConfig.serverTime && (PicUploader.SERVER_TIME = picManConfig.serverTime);
			
			// File related operations
			var t = this, 
				i,
				localImageHash, // A local variable to hold the image hash from the picManConfig
				fileElem = d[get](picManConfig.file);
			// Setting multiple attribute only if supported
			if(PicManager.isMultiUploadSupported) {
				fileElem.setAttribute("multiple", "multiple");
				// Activate the drop box & show the drop text
				activateDropbox(picManConfig.dropBox);
				u.show(d[get](picManConfig.dropText), 1);
			}
			// Attaching on change event 
			u.attach(fileElem, "change", function() {
				// If in progress then just return
				if(inProgress) {
					return;
				}
				
				file = fileElem;
				t.upload();
			});
			// Create Pic Uploader instances if images are already present
			for(i=0; i<startIndex; i++) {
				createPicuploader(i);
				// Initialize the image hash since images are already present
				if(picManConfig.imageHash && (localImageHash=picManConfig.imageHash[i])){
					imageHash[i] = {thumbnailUrl: localImageHash.thumbnailUrl, mainUrl: localImageHash.mainlUrl};
				}
			}
			// Set primary flag to image wrapper
			startIndex && picUploaderHash[primaryIndex].setPrimary();
		},
		
		/**
	     * Function is triggered when user selects files to upload either through 
	     * drag & drop or selecting from browse window. Does the following 
	     * 1. Normalizes the selected files
	     * 2. Pre-upload UI updates
	     * 3. Set the PicManager states accordingly
	     * 4. Creates PicUploader instance and calls the upload method 
	     * 
	     * @method upload  
	     * 
	     * @public
	     * @static	     
	     */				
		upload: function() {
			var fileList = getFileList(), 
				picUploader, 
				localIndex = startIndex, 
				i;			
			
			// Check for errors or empty list first			
			if(!fileList.length || fileList.error) {
				fileList.error && alert(fileList.error);
				return;
			}
			
			// Hide the app pic layer
			u.hide(addPicLayer);
			// Show the Mask
			u.show(maskLayer, 1);
			
			// Set in progress flag
			inProgress = 1; 
			// Set the number of files selected
			selectedFilesCount = fileList.length;
			// Reset the file counter
			fileCounter = 0;
			
			// Create and bind picuploader instances 
			for(i=0; i<selectedFilesCount; i++) {
				// Create the pic uploader instance
				picUploader = createPicuploader(localIndex);
				// Upload the file
				picUploader.upload(fileList[i]);	
				localIndex++;
			}
		},	
		
		/**
	     * Returns the Image Hash which holds the Image Data objects
	     * 
	     * @method getImageHash  
	     * 
	     * @public
	     * @static	     
	     */		
		getImageHash: function() {
			return imageHash;
		},
		
		/**
	     * For a given index removes its corresponding entry from the Image Hash
	     * 
	     * @method removeImageHash  
	     * @param {Number} index The index to remove an entry
	     * 
	     * @public
	     * @static	     
	     */				
		removeImageHash: function(index) {
			if(primaryIndex == index) {// Check if index to be removed is Primary index, then first image becomes primary
				primaryIndex = 0;
			} else if(primaryIndex > index) {// If primary index is greater than removed index, then reduce by 1 since it will be shifted to left
				primaryIndex--;
			}
			imageHash = imageHash.slice(0, index).concat(imageHash.slice(index + 1));
		},
		
		/**
	     * Sets the primary index variable and resets the styles for the previous primary
	     * indexed image 
	     * 
	     * @method setPrimary  
	     * @param {Number} index The indx of the image that has to be made primary
	     * 
	     * @public
	     * @static	     
	     */						
		setPrimary: function(index) {
			if(typeof index != "undefined" && primaryIndex != index) {
				//Remove primary Class
				this.removePrimary(primaryIndex);
				primaryIndex = index;
			}
		},
		
		/**
	     * Removes the primary styles for the given index
	     * 
	     * @method removePrimary  
	     * @param {Number} index The indx of the image to remove the primary styles
	     * 
	     * @public
	     * @static	     
	     */						
		removePrimary: function(index) {
			// Set index to primary if not passed
			if(!index) {
				index = primaryIndex;
			}
			// Remove the primary state from the picture
			picUploaderHash[index].removePrimary();
		},
		
		/**
	     * Reflows all the images in the pic manager arena when a delete operation 
	     * happens. The images which have upload errors are removed from the
	     * area during this operation
	     * 
	     * @method reflow  
	     * 
	     * @public
	     * @static	     
	     */						
		reflow: function() {
			var imgData,
				i=0, 
				l=startIndex;  

			// Clean the image hash first to reomve the errors
			cleanImageHash();
			
			for(; i<l; i++) {
				// Remove the primary from the picture if set
				picUploaderHash[i].isPrimary && picUploaderHash[i].removePrimary();							
				
				// Check if present in hash else set the src as null
				imgData = typeof imageHash[i] != "undefined"?imageHash[i]: null;				 
				picUploaderHash[i].setPicture(imgData);
			}
			// Reset start index
			startIndex = imageHash.length;
			// If there is Image then set Primary
			startIndex && picUploaderHash[primaryIndex].setPrimary();
		},
		
		/**
	     * Determines if the browser can support Multi-File upload and AJAX
	     * based upload
	     * 
	     * @method isMultiUploadSupported  
	     * 
	     * @public
	     * @static	     
	     */								
		isMultiUploadSupported: function(){
			var input = document.createElement("input");
			input.type = "file";
			
			return ('multiple' in input &&
					typeof File != "undefined" &&
					typeof (new XMLHttpRequest()).upload != "undefined");
		}()		
	};
}();