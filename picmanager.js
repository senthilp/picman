var PicManager = function() {
	var d = document,
		get = "getElementById",
		MAX_LIMIT, // Max number of files allowed to be uploaded
		picManConfig, // Pic man config bean
		file, // File browse HTML element
		maskLayer, // Mask Layer
		addLayer, // Add file Layer
		startIndex = 0, // Static closure variable to maintain the start index when file upload
		inProgress = 0, // Flag to indicate if Pic Manager in working
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
		attach = function(element, type, fn) {
		    if (element.addEventListener){
		        element.addEventListener(type, fn, false);
		    } else if (element.attachEvent){
		        element.attachEvent('on' + type, fn);
		    }			
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
				noOpHandler = function(evt) {
					evt.stopPropagation();
					evt.preventDefault();
				},
				pm = PicManager;
			
			// Show the box
			elem.className = elem.className + " activate";	
				
			// Always attach No Operation handler events events first
			attach(elem, "dragenter", function(evt) {
				// Prevent defaults
				noOpHandler(evt);
				// Highlight border
				elem.className = elem.className + " dragenter";
				
			});
			attach(elem, "dragexit", function(evt) {
				// Prevent defaults
				noOpHandler(evt);
				// remove border highlight
				elem.className = elem.className.replace(/ dragenter/g, "");
				
			});
			attach(elem, "dragover", noOpHandler);
			
			// Attach the drop event
			attach(elem, "drop", function(evt) {
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
				elem.className = elem.className.replace(/ dragenter/g, "");				
			});
		};
	
	return {
		init: function(config) {
			// Setting the private static variables 
			picManConfig = config;
			addPicLayer = d[get](picManConfig.addPicLayer);
			maskLayer = d[get](picManConfig.maskLayer);
			MAX_LIMIT = picManConfig.MAX_LIMIT;

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
				picUploader = new PicUploader({
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
					deleteControl: picManConfig.image.deleteControl + localindex,					
					finalCb: function() {
						startIndex++;
						counter++;
						if(counter == length) {
							show(addPicLayer);
							inProgress = 0;
						}
					} 
				}); 
				picUploader.upload();	
				localindex++;
			}
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