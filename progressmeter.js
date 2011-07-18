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
	
	this.start = function(progressInterval) {
		var t = this,
			pi = progressInterval || ProgressMeter.defaults.progressInterval;
		
		progressTimer = setInterval(function() {
			// Update the progress counter first along with incrementing it
			t.progress(++progressPercent);
							
			// If progressPercent is 90 or 100 clear the interval first
			// If 90% and still not complete pause the meter and wait for signal
			progressPercent == 90 && !isComplete && t.stop();
			if(progressPercent == 100) {
				t.stop();
				// Call the finalComplete method
				finalComplete();
			}
		}, progressInterval);
	};
	
	this.stop = function() {
		progressTimer && clearInterval(progressTimer);
	};
	
	this.progress = function(percent) {
		progressPercent = percent;
		progressLayer.style.width = percent + "%";
		percentLayer.innerHTML = percent + "%";
	};
	
	this.complete = function(cb) {
		isComplete = 1;
		callback = cb;
		this.stop();
		this.start(10);
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