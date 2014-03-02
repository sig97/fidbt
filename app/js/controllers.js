'use strict';

/* Controllers */

angular.module('myApp.controllers', ['firebase', 'vr.directives.slider', 'ui.bootstrap'])
   .controller('HomeCtrl', ['$scope', 'syncData', '$timeout', function($scope, syncData, $timeout) {
    
    $scope.collapsedSettings = false;
    $scope.dt = new Date();
    $scope.hstep = 1;
    $scope.mstep = 10;
    //$scope.endDate = "Feb. 25"; //TODO
    $scope.dateOptions = {
      'year-format': "'yy'",
      'starting-day': 1
    };

	  $scope.ghStepSize = "0";
	  $scope.ghDataPoints = "600";
    $scope.ghDataOffset = 0;    
	  
	  syncData('settings/filter').$bind($scope, 'ghDeviceNames');
	  syncData('settings/step').$bind($scope, 'ghStepSize');	  
	  syncData('settings/datapoints').$bind($scope, 'ghDataPoints');
	  syncData('settings/dataOffset').$bind($scope, 'ghDataOffset');
	  
	  $scope.sensors = syncData('settings/sensors');

    var filterString = syncData('settings/filter');
    // Update time offset so to show latest value
    filterString.$on("loaded", function() {
         var name = $scope.ghDeviceNames.split(",")[0];
         //console.log("Getting latest timestamp for sensor: " + name);

         // get latest reading
         var latestValue = syncData('readings/' + name, 1);
         latestValue.$on("loaded", function() {
          var latestEntry = getOneValue(latestValue);

          if(latestEntry == undefined || latestEntry.date == undefined) {
             console.log("No latest sensor data for " + name + " found.");
             return;
          }
          var timeDiff = Date.now() - latestEntry.date;

          var timeOffset = (timeDiff / 1000 / 60);
          // If current time offset setting will not show any value
          if(timeOffset > +$scope.ghStepSize && +$scope.ghDataOffset < timeOffset ) {
             console.log("Auto changing time offset to latest values for " + name + " to: " + timeOffset);               
             $scope.ghDataOffset = timeOffset.toFixed(0);
             $scope.dt = latestEntry.date;
          }
        });
     });

     function getOneValue(items) {
            var returnValue;
            items.$getIndex().some(function(key, i) { 
               // Any value will do
               returnValue = items[key];
               return true;
            });
            return returnValue;
     }


    var dataOffset =  syncData('settings/dataOffset');
    dataOffset.$on("loaded", function() {
      console.log("Time offset updated to" + $scope.ghDataOffset);
      if($scope.ghDataOffset == 0) {
        $scope.dt = undefined;
      } else {
        $scope.dt = Date.now() - $scope.ghDataOffset * 1000 * 60;
      }
    });

    

    //$scope.translateSecTime = function(value) {
    //  return value + ' sec';
    //};
    $scope.translateMinTime = function(value) {
      return value + ' min';
    };
    $scope.translateHourTime = function(value) {
      return value + ' hours';
    };
    $scope.translateDayTime = function(value) {
      return value + ' days';
    };

    syncData('settings/step').$on("loaded", function() {
       syncData('settings/datapoints').$on("loaded", function() {
        console.log("ghStepSize value updated."); 
        
        //initial values
        //$scope.ghSecSlider = $scope.ghStepSize % 60; 
        var newMin = ($scope.ghDataPoints * $scope.ghStepSize/60) % 60;
        var newHour = Math.floor( ($scope.ghDataPoints * $scope.ghStepSize/3600) % 24 );
        var newDay = Math.floor($scope.ghDataPoints * $scope.ghStepSize/3600/24);
        if(newMin != $scope.ghMinSlider) {
          $scope.ghMinSlider = newMin;  
        }
        if(newHour != $scope.ghHourSlider) {
          $scope.ghHourSlider = newHour;
        }
        
        if(newDay != $scope.ghDaySlider) {
          $scope.ghDaySlider = newDay;
        }

      });    
    });

    
    $scope.$watchCollection('[ghMinSlider, ghHourSlider, ghDaySlider]', function() {
      delayedUpdate();
    }, true);

    var delay;
    // Add 500 ms delay to sliders before applying new value to avoid DB overload
    function delayedUpdate () {
      cancelTimer(delay);
      delay = $timeout( function() {
          updateStepSeconds();
      }, 500);
    }
    
    function cancelTimer(timerFunction) {
      if(typeof timerFunction !== 'undefined') {
        $timeout.cancel(timerFunction);
      }
    }

    function updateStepSeconds() {
      var periodInSeconds = $scope.ghDaySlider * 24 * 60 * 60 + $scope.ghHourSlider * 60 * 60 + $scope.ghMinSlider * 60;
      $scope.ghStepSize = (periodInSeconds / $scope.ghDataPoints).toFixed(); 
    }


    $scope.changedTime = function () { };

    $scope.$watch('dt', function() {
      console.log('Date changed to: ' + $scope.dt);

      if($scope.dt == undefined) {
        $scope.ghDataOffset = 0;
      } else {
        $scope.ghDataOffset = ((Date.now() - $scope.dt) / 1000 / 60 ).toFixed(0);
      }
    });

    $scope.calOpen = function($event) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.calOpened = true;
    };

/*
     // Get sensor config
     var sensors =  $scope.sensors;
     sensors.$on("loaded", function() {
         var keys = sensors.$getIndex();
         keys.forEach(function(key, i) {
            console.log(i, sensors[key]); // prints items in order they appear in Firebase     
         });         
     });
     */

     

//Populate data in firebase
/*
     var sensor = syncData('readings/S2');
     sensor.$on("loaded", function() {        
        var maxValues = 6000;
        var timeBetweenSteps = 60000;
        var simValues = Smooth([50, 0, 10, 30, 90, 80, 60, 20, 0, 10, 20, 70, 40], { scaleTo: [0, maxValues] });
        var dateMillis = Date.now() - (maxValues*timeBetweenSteps);
        var lastValue = 0;
        for(var i=0; i<maxValues; i++) {
          sensor.$add({}).then(function(p) {
               p.setWithPriority({date: dateMillis, value: (simValues(++lastValue) + getRandomInt(0, 3)).toFixed(2)}, dateMillis);
               dateMillis += timeBetweenSteps;
          });
        }
        sensor.$off();
     });

     function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
     }
     */
   

   }])


   .controller('LoginCtrl', ['$scope', 'loginService', '$location', function($scope, loginService, $location) {
      $scope.email = null;
      $scope.pass = null;
      $scope.confirm = null;
      $scope.createMode = false;

      $scope.login = function(cb) {
         $scope.err = null;
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else {
            loginService.login($scope.email, $scope.pass, function(err, user) {
               $scope.err = err? err + '' : null;
               if( !err ) {
                  cb && cb(user);
               }
            });
         }
      };

      $scope.createAccount = function() {
         $scope.err = null;
         if( assertValidLoginAttempt() ) {
            loginService.createAccount($scope.email, $scope.pass, function(err, user) {
               if( err ) {
                  $scope.err = err? err + '' : null;
               }
               else {
                  // must be logged in before I can write to my profile
                  $scope.login(function() {
                     loginService.createProfile(user.uid, user.email);
                     $location.path('/account');
                  });
               }
            });
         }
      };

      function assertValidLoginAttempt() {
         if( !$scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( !$scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else if( $scope.pass !== $scope.confirm ) {
            $scope.err = 'Passwords do not match';
         }
         return !$scope.err;
      }
   }])

   .controller('AccountCtrl', ['$scope', 'loginService', 'syncData', '$location', function($scope, loginService, syncData, $location) {
      syncData(['users', $scope.auth.user.uid]).$bind($scope, 'user');

      $scope.logout = function() {
         loginService.logout();
      };

      $scope.oldpass = null;
      $scope.newpass = null;
      $scope.confirm = null;

      $scope.reset = function() {
         $scope.err = null;
         $scope.msg = null;
      };

      $scope.updatePassword = function() {
         $scope.reset();
         loginService.changePassword(buildPwdParms());
      };

      function buildPwdParms() {
         return {
            email: $scope.auth.user.email,
            oldpass: $scope.oldpass,
            newpass: $scope.newpass,
            confirm: $scope.confirm,
            callback: function(err) {
               if( err ) {
                  $scope.err = err;
               }
               else {
                  $scope.oldpass = null;
                  $scope.newpass = null;
                  $scope.confirm = null;
                  $scope.msg = 'Password updated!';
               }
            }
         }
      }

   }]);