/**
 * ProgressMeter creates a dynamic progress bar component in a web page. The 
 * underlying technique is have an outer div with a border and an inner div
 * having a background-color style with the initial width as 0. Based on the
 * progress percentage the width of the inner div is adjusted thus bringing
 * a progress bar experience.
 * The numeric percentage is also displayed along side
 * 
 * @class ProgressMeter
 * @constructor
 * @param {Object} dataObj A data object encapsulating the input paramaters
 * 						   for ProgressMeter class. Mandatory attributes are
 * 						   - progressLayer, the inner div
 * 						   - percentLayer, div to update the numeric persentage	
 * 
 * Note: please refer to CSS classes .meter and .progress to understand the styling
 */
function ProgressMeter(dataObj) {
	var d = document, 
		get = "getElementById", // Shortcut for document.getElementById to enable compression
		progressLayer = d[get](dataObj.progressLayer), // Progress layer
		percentLayer = d[get](dataObj.percentLayer), // Percentage layer
		callback, // callback variable to hold the callback function
		progressTimer, // Object to hold the intervals
		progressPercent = 0, // Progress counter
		isComplete, // Flag to indicate Progress Meter complete is called
		finalComplete = function() {			
			callback && callback(); // Callback function if present
			callback = null; // Reset the callback
			progressPercent = isComplete = 0; // Reset the counter & complete state
		};

    /**
     * Starts the progress meter with the provided progress interval.
     * If no progress interval is provided uses the default value from the
     * ProgressMeter defaults object
     *
     * @method start 
     * @param {Number} progressInterval The interval in milliseconds to run the progress meter     	
     * @public
     */		
	this.start = function(progressInterval) {
		var t = this,
			pi = progressInterval || ProgressMeter.defaults.progressInterval;
		
		progressTimer = setInterval(function() {
			// Update the progress counter first along with incrementing it
			t.progress(++progressPercent);
							
			// If progressPercent is 90 or 100 clear the interval first
			// If 90% and still not complete pause the meter and wait for signal
			progressPercent == 90 && !isComplete && t.stop();
			if(progressPercent >= 100) {
				t.stop();
				// Call the finalComplete method
				finalComplete();
			}
		}, pi);
	};

    /**
     * Stops the progress meter
     *
     * @method stop
     * @public
     */		
	this.stop = function() {
		progressTimer && clearInterval(progressTimer);
	};
	
    /**
     * Updates the progress meter with the bar and the numeric percentage  
     *
     * @method progress 
     * @param {Number} percent The number representing the percentage of progress     	
     * @public
     */		
	this.progress = function(percent) {
		progressPercent = percent;
		progressLayer.style.width = percent + "%";
		percentLayer.innerHTML = percent + "%";
	};

    /**
     * Completes the progress meter from its current state by using the lowest interval,
     * which is 5 milliseconds (https://developer.mozilla.org/en/DOM/window.setTimeout#Minimum_delay_and_timeout_nesting)
     *
     * @method complete 
     * @param {Function} cb The callback function to execute after the progress meter is completed     	
     * @public
     */		
	this.complete = function(cb) {
		isComplete = 1;
		callback = cb;
		this.stop();
		this.start(5);
	};
}

/**
 * Default properties of ProgressMeter
 * Application instance can override it as required
 *
 * @Object defaults
 * @public
 * @static
 */	
ProgressMeter.defaults = {
    /**
     * Intervals to update the ProgressMeter
     * Default value is 50
     *
     * @int progressInterval
     * @public
     */		
	progressInterval: 50
};