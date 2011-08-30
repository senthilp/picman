/**
 * 
 * Utils class has all the JavaScript helpers for the picman application.
 * The main functions are DOM manupulations and event handling, that are 
 * used across all components. 
 * 
 * @class Utils
 * @singleton
 */
var Utils = {
    /**
     * Hides a div layer, takes an optional second parameter to indicate display
     * hiding, else only the visibility is set as hidden.
     * Assumes the element is present in the page
     *
     * @method hide
     * 
     * @param {Object} elem The DOM element that must be hidden
     * @param {Boolean|Number} display Flag to indicate if the element display should be hidden   
     * 	      			
     * @public
     * @static
     */						
	hide: function(elem, display) { 
		if(display) { // If sets then hides display
			elem.style.display = "none";
		} else {
			elem.style.visibility = "hidden";
		}
	},
    /**
     * Shows a div layer, takes an optional second parameter to indicate display
     * showing, else only the visibility is set.
     * Assumes the element is present in the page
     *
     * @method show
     * 
     * @param {Object} elem The DOM element that must be shown
     * @param {Boolean|Number} display Flag to indicate if the element display should be shown   
     * 	      			
     * @public
     * @static
     */						
	show: function(elem, display) { // Shows a layer
		if(display) { // If set makes display block
			elem.style.display = "block";
		} else {
			elem.style.visibility = "visible";
		}			
	},
    /**
     * Updates the content of the input element
     * Assumes the element is present in the page
     *
     * @method updateContent
     * 
     * @param {Object} elem The DOM element for which the content should be updated
     * @param {String} content The content to update   
     * 	      			
     * @public
     * @static
     */			
	updateContent: function(elem, content) {
		elem.innerHTML = content;
	},
    /**
     * Creates an Image element with the given source, height and width
     *
     * @method createImage
     * 
     * @param {String} src The source of the image
     * @param {Number} h The height of image
     * @param {Number} w The width of image
     * 	      			
     * @public
     * @static
     */
	createImage: function(src, h, w) {
		var img = document.createElement('img');
		img.src = src;
		img.height = h;
		img.width = w;			
		return img;
	},
    /**
     * Creates an hidden iframe with the given id and appends it to the 
     * body
     *
     * @method createIframe
     * 
     * @param {String} id The id for the iframe
     * 	      			
     * @public
     * @static
     */	
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
    /**
     * Attach event listeners to DOM elements
     *
     * @method attach
     * 
     * @param {Object} element The DOM element to attach the event
     * @param {String} type Type of event 
     * @param {Function} fn The function to attache 
     * 	      			
     * @public
     * @static
     */		
	attach: function(element, type, fn) {
	    if (element.addEventListener){
	        element.addEventListener(type, fn, false);
	    } else if (element.attachEvent){
	        element.attachEvent('on' + type, fn);
	    }			
	},	
    /**
     * Add a CSS class to a DOM element
     *
     * @method addClass
     * 
     * @param {Object} element The DOM element to add a class
     * @param {String} className The classname to add  
     * 	      			
     * @public
     * @static
     */		
	addClass: function(elem, className) {
		elem.className = elem.className + " " + className;
	},
    /**
     * Removes a class from a DOM element
     *
     * @method removeClass
     * 
     * @param {Object} element The DOM element for which the class needs to be removed
     * @param {String} className The classname to remove  
     * 	      			
     * @public
     * @static
     */			
	removeClass: function(elem, className) {
		var pattern = new RegExp(" " + className, "g");
		elem.className = elem.className.replace(pattern, "");
	}	
};