(function() {
   'use strict';

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
					var dateValues = [];

					var targetValues = [];

					var ref = firebaseRef('readings/' + name);
			        ref = ref
			        .startAt(start)
			        .endAt(stop)
			        .once('value', function(snap) {
			        	snap.forEach(function(reading) {
			        		var dateValue = reading.child("date").val();
			        		var readValue = reading.child("value").val();
							powerValues.push(readValue);
							dateValues.push(dateValue);
			        	});

			        	console.log("values: " + powerValues);
			        	var valueLen = powerValues.length;
			        	console.log("total amount: " + valueLen + ", first: " + dateValues[0] + ": " + powerValues[0] + ", last:" + dateValues[valueLen-1] + ": " + powerValues[valueLen-1]);


			        	for(var goal = start; goal <= stop; goal += step) {
			        		var closest = dateValues[0];
			        		var closestIndex = 0;
							var bestDistanceFoundYet = Number.MAX_VALUE;
							// We iterate on the array...
							for (var i = 0; i < dateValues.length; i++) {
						      var d = Math.abs(goal - dateValues[i]);
						      //console.log("goal:" + goal +",  diff=" + d);
						      if (d < bestDistanceFoundYet) {
						      	 bestDistanceFoundYet = d;
						         // For the moment, this value is the nearest to the desired number...						         
						         closest = dateValues[i];
						         closestIndex = i;
							   } else {
							   		break;
							   }
							}

							targetValues.push(powerValues[closestIndex]);

			        	}
			        	console.log("targetValues: " + targetValues);


						if(powerValues.length > 0 ) {
							var sum = targetValues.reduce(function(a, b) { return a + b });
							sum = sum/1000;
							//console.log(sum);
							titleCallback(name, name + ": " + sum);
						}
						callback(null, targetValues);

			        });
		}
	}]);
   
      // put your services here!
      // .service('serviceName', ['dependency', function(dependency) {}]);

})();

