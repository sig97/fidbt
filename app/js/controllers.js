'use strict';

/* Controllers */

angular.module('myApp.controllers', [])
   .controller('HomeCtrl', ['$scope', 'syncData', 'sensorData', function($scope, syncData, sensorData) {
	  $scope.step = "6000";
	  $scope.dataPoints = "400";
	  
      syncData('syncedValue').$bind($scope, 'syncedValue');
	  syncData('syncedValue').$bind($scope, 'ghDeviceNames');
	  syncData('settings/step').$bind($scope, 'step');
	  syncData('settings/step').$bind($scope, 'ghStep');	  
	  syncData('settings/datapoints').$bind($scope, 'dataPoints');
	  syncData('settings/datapoints').$bind($scope, 'ghDataPoints');	  
	  syncData('settings/dataOffset').$bind($scope, 'dataOffset');
	  syncData('settings/dataOffset').$bind($scope, 'ghDataOffset');	
	  
	  var dateMillis = new Date().getMilliseconds();
	  
	  function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	  }
	  
//	  var sensor = syncData('readings/BEAM');
//	  sensor.$on("loaded", function() {
//		  var maxValues = 200;
//		  dateMillis = dateMillis - (maxValues*5000);
//		  for(var i=0; i<maxValues; i++) {
//		    dateMillis = dateMillis + 5000;
//			sensor.$add({date: dateMillis, value: getRandomInt(55, 100)});
//		  }
//	  });
	  
	  $scope.rawData = '';
	  $scope.sensors = syncData('settings/sensors');
	  	  	  
	  //$scope.readings = readings;
//	  var totalValues = [];	  
//	  readings.$on("loaded", function() {
//		var keys = readings.$getIndex();
//		keys.forEach(function(key, i) {
//			console.log(i, readings[key]); // prints items in order they appear in Firebase		
//			totalValues.push(readings[key]);
//		});
//		$scope.rawData = totalValues;
		//$scope.deviceNames = "BEAM, STZ";
//	   });
	  
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