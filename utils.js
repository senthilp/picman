var Utils = {
	hide: function(elem, display) { // Hides a layer 
		if(display) { // If sets then hides display
			elem.style.display = "none";
		} else {
			elem.style.visibility = "hidden";
		}
	},
	show: function(elem, display) { // Shows a layer
		if(display) { // If set makes display block
			elem.style.display = "block";
		} else {
			elem.style.visibility = "visible";
		}			
	},
	updateContent: function(elem, content) {
		elem.innerHTML = content;
	},
	createImage: function(src, h, w) {
		var img = document.createElement('img');
		img.src = src;
		img.height = h;
		img.width = w;			
		return img;
	},
	createIframe: function(id) {
		var iframe, d = document;
		try{
			// To overcome IE hack
			iframe = d.createElement('<iframe name="' + id + '">');
		} catch(ex) {
			iframe = d.createElement('iframe');
			iframe.setAttribute('name', id);
		}
		
		iframe.setAttribute('id', id);						
		iframe.style.display = 'none';
        d.body.appendChild(iframe);

        return iframe;			
	},
	attach: function(element, type, fn) {
	    if (element.addEventListener){
	        element.addEventListener(type, fn, false);
	    } else if (element.attachEvent){
	        element.attachEvent('on' + type, fn);
	    }			
	},	
	addClass: function(elem, className) {
		elem.className = elem.className + " " + className;
	},
	removeClass: function(elem, className) {
		var pattern = new RegExp(" " + className, "g");
		elem.className = elem.className.replace(pattern, "");
	}	
};