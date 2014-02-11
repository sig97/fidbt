'use strict';

/* Directives */


angular.module('myApp.directives', [])
  .directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
  
  .directive('ghVisualization', ['sensorData', function(sensorData) {
    // constants
	var margin = 20,
    width = 960,
    height = 500 - .5 - margin,
	stepSize = 0, dataSize = 0, serverDelay=5e3;
	
	return {
      restrict: 'E',
	  scope: {
        devices: '=',
		dataoffset: '=',
		datapoints: '=',
		step: '='
      },
      link: function (scope, elm, attrs) {

		var current_date = new Date();                                                     

        // You can use this formula to calculate the offset:
        // [ { Number of minutes elapsed today }
        // - { Time your data ends in minutes(in this case 4:30 PM or 960 minutes) + 10 } ]
        var offset_mins = ((60*current_date.getHours()) + current_date.getMinutes()) - 970;

        // Don't forget to convert this to milliseconds!
        var offset_millis = offset_mins * 60 * 1000; 
							
		var vis = d3.select(elm[0]);
		
		var context;
				
		function createContext(newStepSize, newDataSize, newOffset) {
			console.log("stepSize: " + newStepSize + ", dataSize: " + newDataSize);	
			dataSize = newDataSize;	
			stepSize = newStepSize;
			if (!(+newStepSize > 0 && +newDataSize > 0)) {
				console.log("resetting context");
				vis.selectAll('*').remove();
				if(context) {context.stop(); context = null; }
				return;
			}
			context = cubism.context()
				.step(stepSize) // Distance between data points in milliseconds
				.size(dataSize) // Number of data points
				.serverDelay(5e3);
				//.stop(); // Fetching from a static data source; don't update values
				
			// On mousemove, reposition the chart values to match the rule.
			context.on("focus", function(i) {
				d3.selectAll("#demo .value").style("right", i == null ? null : context.size() - i + "px");
			});				
		}
		
		function updateTitle(oldTitle, newTitle) {
			console.log("update title to: " + newTitle);
			d3.selectAll("#demo .horizon .title").filter(function() { return ($(this).text() === oldTitle) }).text(newTitle);
		}
		
		function readings(name) {
		    name = name.trim();
			return context.metric(function(start, stop, step, callback) {
				sensorData(name, start, stop, step, callback, updateTitle);
				//callback(null, values);
			}, name );
        }

		function draw_graph(source_list) {
			
			vis // Select the div on which we want to act
			  .selectAll(".axis") // This is a standard D3 mechanism to
			  .data(["top"]) // bind data to a graph. In this case
			  .enter() // we're binding the axes "top" and "bottom".
			  .append("div") // Create two divs and
			  .attr("class", function(d) { // give them the classes
				return d + " axis"; // top axis and bottom axis
			  }) // respectively
			  .each(function(d) { // For each of these axes,
				d3.select(this) // draw the axes with 4 intervals
				  .call(context.axis() // and place them in their proper places
				  .ticks(4).orient(d));
			  });


			vis
			  .selectAll(".horizon")
			  .data(source_list.map(readings))
			  .enter()
			  .insert("div", ".bottom") // Insert the graph in a div
			  .attr("class", "horizon") // Turn the div into
			  .call(context.horizon() // a horizon graph
			  //.format(d3.format("+,.2p")) // Format the values to 2 floating-point decimals
			  ); 
		}		

		function redraw_graph() {
			if(!context) {
				console.log("Context not yet initialized, cannot redraw graph");
				return;
			}
			vis.selectAll('*').remove();
		
            vis.append("div") // Add a vertical rule
              .attr("class", "rule") // to the graph
              .call(context.rule());
            
			//draw_graph(newVal.split(","));
			var dataSources = elm[0].getAttribute('devices');
			console.log("Redrawing using: " + dataSources);
			draw_graph(dataSources.split(","));
		}
	  
	  	scope.$watch('devices', function (newVal, oldVal) {
			//alert(newVal);
			if(!newVal) {
				return;
			}
			elm[0].setAttribute('devices', newVal);
			//createContext(6e4, 400);
			createContext(stepSize, dataSize, serverDelay);
			redraw_graph();
		});
		
		scope.$watch('datapoints', function (newVal, oldVal) {
			if(!newVal) {
				return;
			}
			elm[0].setAttribute('dataPoints', newVal);
			
			createContext(stepSize, newVal, serverDelay);
			redraw_graph();
		});
		
		scope.$watch('step', function (newVal, oldVal) {
			if(!newVal) {
				return;
			}
			elm[0].setAttribute('step', newVal);
			
			newVal = +newVal*1000; // convert to ms
			createContext(newVal, dataSize, serverDelay);
			redraw_graph();
		});
		
		scope.$watch('dataoffset', function (newVal, oldVal) {
			if(!newVal || newVal == oldVal) {
				return;
			}
			//elm[0].setAttribute('dataoffset', newVal);
			//createContext(newVal, dataSize, newVal);
			//redraw_graph();
		});
			//draw_graph(["BEAM", "BF.B", "STZ"]);
      }
	};
  }]);