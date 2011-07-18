var PicManager = function() {
	var d = document,
		get = "getElementById",
		MAX_LIMIT, // Max number of files allowed to be uploaded
		picManConfig, // Pic man config bean
		file, // File browse HTML element
		maskLayer, // Mask Layer
		addLayer, // Add file Layer
		startIndex = 0, // Static closure variable to maintain the start index when file upload
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
				if(file.files) {
					for(i=0, l=file.files.length; i < l; i++) {
						current = file.files[i];
						fileList.push({file: current, name: current.name || current.fileName, size: current.size});
					}
				} else {
					// IE 7 & 8 which does not support multi file upload
					// Set size as mdedian 4MB					
					fileList.push({file: file, name: file.value.replace(/.*(\/|\\)/, ""), size: 4046357});
				}
			}
			
			return fileList;
		};
	
	return {
		init: function(config) {
			var t = this;
			picManConfig = config;
			file = d[get](picManConfig.file);
			addPicLayer = d[get](picManConfig.addPicLayer);
			maskLayer = d[get](picManConfig.maskLayer);
			MAX_LIMIT = picManConfig.MAX_LIMIT;
			attach(file, "change", function() {
				t.upload();
			});
		},
		
		upload: function() {
			var fileList = getFileList(), 
				picUploader, 
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
			
			// Create and bind picuploader instances 
			for(i=0, length=fileList.length; i<length; i++) {
				picUploader = new PicUploader({
					uploadForm: picManConfig.uploadForm,
					serverURL: picManConfig.serverURL,
					maskLayer: maskLayer,
					file: fileList[i], 
					fileNameLayer: picManConfig.image.fileNameLayer + startIndex, 
					progressMeterLayer: picManConfig.image.progressMeterLayer + startIndex,
					progressLayer: picManConfig.image.progressLayer + startIndex,
					percentLayer: picManConfig.image.percentLayer + startIndex,
					errorLayer: picManConfig.image.errorLayer + startIndex,
					imageWrapper: picManConfig.image.imageWrapper + startIndex,
					controlsLayer: picManConfig.image.controlsLayer + startIndex,
					overlayLayer: picManConfig.image.overlayLayer + startIndex,
					zoomLayer: picManConfig.image.zoomLayer + startIndex,
					picContainer: picManConfig.image.picContainer + startIndex,
					closeZoomLink: picManConfig.image.closeZoomLink + startIndex,
					zoomControl: picManConfig.image.zoomControl + startIndex,
					deleteControl: picManConfig.image.deleteControl + startIndex,					
					finalCb: function() {
						startIndex++;
						counter++;
						if(counter == length) {
							show(addPicLayer);
						}
					} 
				}); 
				picUploader.upload();				
			}
		}
	};
}();