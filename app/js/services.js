(function() {
  /* 'use strict'; */

   /* Services */

   angular.module('myApp.services', ['myApp.service.login', 'myApp.service.firebase', 'firebase'])

   .factory('sensorData', ['firebaseRef', 'syncData', '$firebase', function(firebaseRef, syncData, $firebase) {
    
		return function (name, start, stop, step, callback, titleCallback) {
			name = name.trim();
			
			// convert start & stop to milliseconds
			start = +start;
			stop = +stop;
			var steps = (stop - start) / step;
			console.log("Number of steps: " + steps + " for " + name);
			console.log("From: " + start + " to: " + stop + ", step delay=" + step);

			var powerValues = [];

	        // Get main data set
			var ref = firebaseRef('readings/' + name);
	        ref = ref
	        .startAt(start)
	        .endAt(stop)
	        .once('value', function(snap) {
	        	powerValues = interpolateValues(snap, start, step, steps);

	        	if(powerValues.length == 0) {
	        		callback("No data found between timestamp "+ start + " and " +  stop, []);
	        	} else {
	        		callback(null, powerValues);	        		
	        	}
	        });


	        function interpolateValues(snap, start, step, steps) {
				var targetValues = [];

	       		var currentIndex = 0, targetTimeValue = start, prevValue, prevDateValue;
	        	var delta = Number.MAX_VALUE;

				var startTime = new Date().getTime();
				
	        	snap.forEach(function(reading) {
	        		var dateValue = reading.child("date").val();
	        		var readValue = reading.child("value").val();

					setTimeValue(dateValue, readValue);
	        	});

	        	//var endTime = new Date().getTime();				
				//console.log('Loaded ' + dateValues.length + ' values for ' + name + ' in: ' + (endTime - startTime));

				//var endTime = new Date().getTime();				
				//console.log('Execution time for ' + name + ': ' + (endTime - startTime));

	        	function setTimeValue(dateValue, readValue) {
	        		if(currentIndex <= steps) {
						var newDelta = Math.abs(targetTimeValue - dateValue);
						if(newDelta < delta) {
							delta = newDelta;
						} else {
							if(prevValue == undefined) {
								prevValue = readValue;
								//prevDateValue = dateValue;
							}
							targetValues.push(+prevValue);

							currentIndex += 1;
							targetTimeValue += step;

							// Recalculate timestamp deltas
							delta = Math.abs(targetTimeValue - prevDateValue);
							newDelta = Math.abs(targetTimeValue - dateValue);
							if(newDelta >= delta) {
								setTimeValue(dateValue); 
							} else {
								delta = newDelta;
							}
							
						}
						prevValue = readValue;
						prevDateValue = dateValue;
					}
				}

				var valueLen = targetValues.length;
	        	//console.log("Fetched values: " + valueLen + ", db values: " + dateValues.length); 
	        	if(valueLen > 0 && valueLen < steps) {
	        		var lastValue = targetValues[valueLen-1];
	        		for(var i = valueLen; i < steps; i++) {
	        			targetValues.push(lastValue);	        			
	        		}
	        	}
	        	
/*
	        	var valueLen = powerValues.length;

//				var startTime = new Date().getTime();
				var valueSum = 0;
	        	for(var goal = start; goal <= stop; goal += step) {
	        		// Find a reading which is closest to the requested timestamp
	        		var closestIndex = binaryClosestIndexOf.call(dateValues, goal);
	        		var closestValue = powerValues[closestIndex];
					targetValues.push(closestValue);
					valueSum += +closestValue;
	        	}
	        	titleCallback(name, name + ": " + (valueSum/1000).toFixed(1));	        	
	        	//console.log("targetValues: " + targetValues);	        	
*/
	        	var endTime = new Date().getTime();				
				console.log('Execution time for ' + name + ': ' + (endTime - startTime));
				
				return targetValues;
	        }


			/**
		     * Performs a binary search on the host array. This method can either be
		     * injected into Array.prototype or called with a specified scope like this:
		     * binaryClosestIndexOf.call(someArray, searchElement);
		     *
		     * @param {*} searchElement The item to search for within the array.
		     * @return {Number} The index of the element which defaults to -1 when not found.
		     */
		    function binaryClosestIndexOf(searchElement) {
		        'use strict';
		    
		        var minIndex = 0;
		        var maxIndex = this.length - 1;
		        var currentIndex;
		        var currentElement;
		        var resultIndex;
		    
		        while (minIndex <= maxIndex) {
		                resultIndex = currentIndex = (minIndex + maxIndex) / 2 | 0;
		                currentElement = this[currentIndex];
		    
		                if (currentElement < searchElement) {
		                        minIndex = currentIndex + 1;
		                }
		                else if (currentElement > searchElement) {
		                        maxIndex = currentIndex - 1;
		                }
		                else {
		                        return currentIndex;
		                }
		        }
		    
		        //return ~maxIndex;
		        // Get closest value
		        var startIndex = currentIndex, endIndex = currentIndex;
		        if(currentIndex > 0) {
		        	startIndex = currentIndex - 1;
		        }
		        if(currentIndex < this.length -1) {
		        	endIndex = currentIndex + 1;
		        }
		        var closestLocalIndex = linearClosestIndexOf(this.slice(startIndex, 1 + endIndex), searchElement);
		        if(currentIndex > 0) {
		        	return currentIndex - 1 + closestLocalIndex;
		        } else {
		        	return currentIndex + closestLocalIndex;
		        }
		    }

			// Loop through a sorted array to find best match for a goal value, return its array index
	        function linearClosestIndexOf(valueArray, goal) {
	        	var closestIndex = 0;
				var bestDistanceFoundYet = Number.MAX_VALUE;
				// We iterate on the array...
				for (var i = 0; i < valueArray.length; i++) {
			      var d = Math.abs(goal - valueArray[i]);
			      //console.log("goal:" + goal +",  diff=" + d);
			      if (d < bestDistanceFoundYet) {
			      	 bestDistanceFoundYet = d;
			         // For the moment, this value is the nearest to the desired number...						         
			         closestIndex = i;
				   } else {
				   		break;
				   }
				}

				//console.log("Closest index of " + goal + " in " + valueArray + " is " + closestIndex);
				return closestIndex;
	        }
	
		}
	}]);
   
      // put your services here!
      // .service('serviceName', ['dependency', function(dependency) {}]);

})();

