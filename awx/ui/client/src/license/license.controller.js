/*************************************************
 * Copyright (c) 2016 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/

export default
    ['Wait', '$state', '$scope', '$rootScope', '$location', 'GetBasePath',
    'Rest', 'ProcessErrors', 'CheckLicense', 'moment','$window',
    function( Wait, $state, $scope, $rootScope, $location, GetBasePath, Rest,
        ProcessErrors, CheckLicense, moment, $window){
        $scope.getKey = function(event){
            // Mimic HTML5 spec, show filename
            $scope.fileName = event.target.files[0].name;
            // Grab the key from the raw license file
            var raw = new FileReader();
            // readAsFoo runs async
            raw.onload = function(){
                try {
                    $scope.newLicense.file = JSON.parse(raw.result);
                }
                catch(err) {
                    ProcessErrors($rootScope, null, null, null, {msg: 'Invalid file format. Please upload valid JSON.'});
                }
            };
            try {
                raw.readAsText(event.target.files[0]);
            }
            catch(err) {
                ProcessErrors($rootScope, null, null, null, {msg: 'Invalid file format. Please upload valid JSON.'});
            }
        };
        // HTML5 spec doesn't provide a way to customize file input css
        // So we hide the default input, show our own, and simulate clicks to the hidden input
        $scope.fakeClick = function(){
            $('#License-file').click();
        };

        $scope.downloadLicense = function(){
            $window.open('https://www.ansible.com/license', '_blank');
        };

		$scope.newLicense = {};
		$scope.submit = function(){
			Wait('start');
			CheckLicense.post($scope.newLicense.file, $scope.newLicense.eula)
				.success(function(){
					reset();
					init();
					if($rootScope.licenseMissing === true){
						$state.go('dashboard', {
							licenseMissing: false
						});
					}
					else{
						$scope.success = true;
						$rootScope.licenseMissing = false;
						// for animation purposes
						var successTimeout = setTimeout(function(){
							$scope.success = false;
							clearTimeout(successTimeout);
						}, 4000);
					}
			});
		};
	 	var calcDaysRemaining = function(seconds){
	 		// calculate the number of days remaining on the license
			var duration = moment.duration(seconds, 'seconds').asDays();
			duration = Math.floor(duration);
            duration = (duration!==1) ? `${duration} Days` : `${duration} Day`;
			return duration;
	 	};


        var calcExpiresOn = function(days){
            // calculate the expiration date of the license
            return moment().add(days, 'days').calendar();
        };
        var init = function(){
            $scope.fileName = "No file selected.";
            $scope.title = $rootScope.licenseMissing ? "Tower License" : "License Management";
            Wait('start');
            CheckLicense.get()
            .then(function(res){
                $scope.license = res.data;
                $scope.license.version = res.data.version.split('-')[0];
                $scope.time = {};
                $scope.time.remaining = calcDaysRemaining($scope.license.license_info.time_remaining);
                $scope.time.expiresOn = calcExpiresOn($scope.time.remaining);
                $scope.valid = CheckLicense.valid($scope.license.license_info);
                Wait('stop');
            });
        };
        var reset = function(){
            document.getElementById('License-form').reset();
        };
        init();
     }
    ];
