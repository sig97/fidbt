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
					
					var totalValues = [];
					var readings = syncData('readings/' + name, steps);
					readings.$on("loaded", function() {
						var keys = readings.$getIndex();
						keys.forEach(function(key, i) {
							totalValues.push(readings[key].value);
							//console.log(i, readings[key].value); // prints items in order they appear in Firebase
						});
						if(totalValues.length > 0 ) {
							var sum = totalValues.reduce(function(a, b) { return a + b });
							sum = sum/1000;
							console.log(sum);
							titleCallback(name, name + ": " + sum);
						}
						callback(null, totalValues);
						//$scope.deviceNames = "BEAM, STZ";
					});
					
					readings.$on("child_added", function(snapshot) {
						//if(snapshot 
						//console.log(snapshot);
					});
																		
		}
	}]);
   
      // put your services here!
      // .service('serviceName', ['dependency', function(dependency) {}]);

})();

