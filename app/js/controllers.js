'use strict';

/* Controllers */

angular.module('myApp.controllers', ['firebase', 'vr.directives.slider'])
   .controller('HomeCtrl', ['$scope', 'syncData', '$timeout', function($scope, syncData, $timeout) {
	  $scope.stepSize = "0";
	  $scope.dataPoints = "600";
	  
    syncData('settings/filter').$bind($scope, 'ghFilter');
	  syncData('settings/filter').$bind($scope, 'ghDeviceNames');
	  syncData('settings/step').$bind($scope, 'stepSize');
	  syncData('settings/step').$bind($scope, 'ghStep');	  
	  syncData('settings/datapoints').$bind($scope, 'dataPoints');
	  syncData('settings/datapoints').$bind($scope, 'ghDataPoints');	  
	  syncData('settings/dataOffset').$bind($scope, 'dataOffset');
	  syncData('settings/dataOffset').$bind($scope, 'ghDataOffset');	
	  
	  $scope.sensors = syncData('settings/sensors');

     var filterString = syncData('settings/filter');
     filterString.$on("loaded", function() {
         var name = $scope.ghFilter.split(",")[0];
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
            if(timeOffset > +$scope.stepSize && +$scope.ghDataOffset < timeOffset ) {
               console.log("Auto changing time offset to latest values for " + name + " to: " + timeOffset);               
               $scope.ghDataOffset = timeOffset.toFixed(0);
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


      // Add one second delay to sliders before applying new value, to avoid fetching from database
      function updateStepSeconds() {
        var periodInSeconds = $scope.ghDaySlider * 24 * 60 * 60 + $scope.ghHourSlider * 60 * 60 + $scope.ghMinSlider * 60;
        $scope.stepSize = (periodInSeconds / $scope.dataPoints).toFixed(); 
        // + $scope.ghSecSlider;
      }

      syncData('settings/step').$on("loaded", function() {
        syncData('settings/datapoints').$on("loaded", function() {
          console.log("stepSize value loaded."); 
          
          //initial values
          //$scope.ghSecSlider = $scope.stepSize % 60; 
          var newMin = ($scope.dataPoints * $scope.stepSize/60) % 60;
          var newHour = ($scope.dataPoints * $scope.stepSize/3600) % 24;
          var newDay = Math.floor($scope.dataPoints * $scope.stepSize/3600/24);
          if(newMin != $scope.ghMinSlider) {
            console.log("New minutes=" + newMin);
            $scope.ghMinSlider = newMin;  
          }
          if(newHour != $scope.ghHourSlider) {
            console.log("New hour=" + newHour);
            $scope.ghHourSlider = newHour;
          }
          
          if(newDay != $scope.ghDaySlider) {
            console.log("New days=" + newDay);
            $scope.ghDaySlider = newDay;
          }
  
        });    
      });

/*
      var secDelay;
      $scope.$watch('ghSecSlider', function() { 
          console.log("Changing seconds...");
          cancelTimer(secDelay);
          secDelay = $timeout( function() {
            updateStepSeconds();
          }, 1000);

      }, true);*/

      var minDelay;
      $scope.$watch('ghMinSlider', function() { 
          cancelTimer(minDelay);
          minDelay = $timeout( function() {
            updateStepSeconds();
          }, 1000);

      }, true);

      var hourDelay;
      $scope.$watch('ghHourSlider', function() { 
          cancelTimer(hourDelay);
          hourDelay = $timeout( function() {
            updateStepSeconds();
          }, 1000);

      }, true);

      var dayDelay;
      $scope.$watch('ghDaySlider', function() { 
          cancelTimer(dayDelay);
          dayDelay = $timeout( function() {
            updateStepSeconds();
          }, 1000);

      }, true);

      function cancelTimer(timerFunction) {
        if(typeof timerFunction !== 'undefined') {
          $timeout.cancel(timerFunction);
        }
      }


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

     function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
     }

/*
//Populate data in firebase
     var sensor = syncData('readings/S1');
     sensor.$on("loaded", function() {        
        var maxValues = 1000;
        var timeBetweenSteps = 60000;
        var simValues = Smooth([20, 22, 35, 45, 30], { scaleTo: [0, maxValues] });
        var dateMillis = Date.now() - (maxValues*timeBetweenSteps);
        var lastValue = 0;
        for(var i=0; i<maxValues; i++) {
          sensor.$add({}).then(function(p) {
               p.setWithPriority({date: dateMillis, value: simValues(++lastValue).toFixed(2)}, dateMillis);
               dateMillis += 5000;
          });
        }
        sensor.$off();
     });
  */ 

   }])

  .controller('ChatCtrl', ['$scope', 'syncData', function($scope, syncData) {
      $scope.newMessage = null;

      // constrain number of messages by limit into syncData
      // add the array into $scope.messages
      $scope.messages = syncData('messages', 10);

      // add new messages to the list
      $scope.addMessage = function() {
         if( $scope.newMessage ) {
            $scope.messages.$add({text: $scope.newMessage});
            $scope.newMessage = null;
         }
      };
	  
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