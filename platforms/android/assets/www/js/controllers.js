var _currentuser;
var _currentsouser;
var _currentlocation;

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}

function getCurrentUserID() {
    if (_currentuser)
        return _currentuser.id;
    else
        return null;
}

function setCurrentUser (secureUser, $firebase) {
    _currentuser = secureUser;
    log.info("currentuser url: " + BASE_URL + "/users/" + getCurrentUserID() + "/");
    _currentsouser = $firebase(new Firebase(BASE_URL + "/users/" + getCurrentUserID() + "/"));
}

function getCurrentUserAlias() {
    if (_currentsouser)
        return _currentsouser.alias;
    else
        return null;
}

angular.module('starter.controllers', ['firebase', 'ionic', 'angularGeoFire'])

    .controller('AppCtrl', function ($state, $scope, $window, $rootScope, $firebase, $ionicLoading, $ionicPopup) {
        log.info("app started");

        $rootScope.postToChat = function (post, chatId, callback) {
            var chatRef = new Firebase(BASE_URL + "/chats/geoFire/dataById/" + chatId);
            chatRef.child("posts").push({
                post: post,
                posterId: getCurrentUserID(),
                posterAlias: getCurrentUserAlias(),
                postedDateTime: new Date().getTime(),
                latitude: _currentlocation[0],
                longitude: _currentlocation[1]
            });
        }

        $scope.initLocation = function() {
            $scope.loading = $ionicLoading.show({
                content: 'Fetching location..'
            });

            _currentlocation = null;

            if (navigator.geolocation !== 'undefined') {
                navigator.geolocation.getCurrentPosition(
                    function(pos) {
                        _currentlocation = [
                                Math.round(pos.coords.latitude * 100) / 100,
                                Math.round(pos.coords.longitude * 100) / 100
                        ];

                        log.info("Updated location: " + _currentlocation);

                        $scope.loading.hide();

                        locationWatchId = navigator.geolocation.watchPosition(function(updatedPos) {
                                _currentlocation = [
                                        Math.round(updatedPos.coords.latitude * 100) / 100,
                                        Math.round(updatedPos.coords.longitude * 100) / 100
                                ];
                                log.info("Updated location: " + _currentlocation);
                            },
                            function (err) {
                                log.error("Failed updating location: " + err);
                            },
                            {
                                maximumAge: 3000,
                                timeout: 60000,
                                enableHighAccuracy: true
                            });
                    },
                    function (err) {
                        $scope.loading.hide();
                        $ionicPopup.alert({
                            title: 'Location Not Found',
                            content: 'Before running this app please make sure Location services are enabled on your device. Functionality will be limited without it.'});
                    },
                    {
                        maximumAge: 3000,
                        timeout: 60000,
                        enableHighAccuracy: true
                    }
                );
            } else {
                $scope.loading.hide();
                $ionicPopup.alert({
                    title: 'Location Not Found',
                    content: 'Before running this app please make sure Location services are enabled on your device. Functionality will be limited without it.'
                });
            }
        }

        $scope.initAuth = function () {
            shoutoutRef = new Firebase(BASE_URL);

            auth = new FirebaseSimpleLogin(shoutoutRef, function (error, user) {
                if ($rootScope.loading)
                    $rootScope.loading.hide();

                if (error) {
                    // an error occurred while attempting login
                    log.error(error);
                    $ionicPopup.alert({
                        title: 'Login Failed',
                        content: "Invalid username and/or password."
                    });
                    $state.go("app.login");
                } else if (user) {
                    // user authenticated with Firebase
                    log.info('User ID: ' + user.uid + ', Provider: ' + user.provider);
                    setCurrentUser (user, $firebase);

                    $state.go("app.chats");
                } else {
                    // user is logged out
                    log.info("user is logged out");
                    $state.go("app.login");
                }
            });
        }

        $scope.initAuth();
        $scope.initLocation();
    })

    .controller('LoginCtrl', function ($scope, $state, $rootScope, $ionicLoading, $ionicPopup) {

        $scope.login = function($event) {
            log.info($event);

            $rootScope.loading = $ionicLoading.show({
                content: 'Signing in..'
            });

            auth.login('password', {
                email: $scope.email,
                password: $scope.password
            });
        }

        $scope.register = function() {
            $state.go('app.register');
        }
    })

    .controller('LogoutCtrl', function () {
        log.info("logging out..");
        auth.logout();
    })

    .controller('RegisterCtrl', function ($scope, $rootScope, $state, $firebase, $ionicLoading, $ionicPopup) {
        $scope.register = function () {

            if (!$scope.password || $scope.password == '') {
                $ionicPopup.alert({
                    title: 'Bad Password',
                    content: "Password cannot be blank."
                });

                return;
            } else if ($scope.password != $scope.passwordConfirm) {
                    $ionicPopup.alert({
                        title: 'Password Mismatch',
                        content: "Passwords do not match."
                    });

                    return;
            }

            $rootScope.loading = $ionicLoading.show({
                content: 'Registering, please wait..'
            });

            auth.createUser($scope.email, $scope.password, function(error, user) {
                if (!error) {
                    setCurrentUser(user, $firebase);
                    var userRef = new Firebase(BASE_URL + "/users/" + getCurrentUserID());

                    userRef.set(
                        {
                            alias: $scope.alias,
                            email: $scope.email,
                            radius: "unlimited",
                            chatIdList: []
                        }
                    );

                    auth.login('password', {
                        email: $scope.email,
                        password: $scope.password
                    });

                } else {
                    $rootScope.loading.hide();

                    $ionicPopup.alert({
                        title: 'Registration Failed',
                        content: error
                    });
                }
            });
        }
    })

    .controller('ChatsCtrl', function ($scope, $geofire, $interval, $ionicPopup) {
        $scope.chats = [];
        $scope.searchInteval;
        $scope.findShoutsInMyArea = function() {

            if (!angular.isDefined(_currentsouser))
                return;

            var geo = $geofire(new Firebase(BASE_URL + "/chats"));

            if ($scope.lastSearch)
                geo.$offPointsNearLoc($scope.lastSearch.latLon, $scope.lastSearch.radius, "geo:search");


            var radius;
            if (_currentsouser.radius === 'undefined' || _currentsouser.radius == 'unlimited') {
                radius = 200;
            } else {
                radius = _currentsouser.radius;
            }

            $scope.lastSearch = {
                latLon: _currentlocation,
                radius: angular.copy(_currentsouser.radius)
            }

            geo.$onPointsNearLoc($scope.lastSearch.latLon, $scope.lastSearch.radius, 'geo:search');
        }

        $scope.startSearchingAreaForShoutouts = function startSearchingAreaForShoutouts() {
            if (angular.isDefined($scope.searchInteval))
                return;

            $scope.searchInteval = $interval(function() {
                $scope.findShoutsInMyArea();
            }, SHOUTOUT_SCAN_INTERVAL);

            $scope.findShoutsInMyArea();
        }

        $scope.stopSearchingAreaForShoutouts = function stopSearchingAreaForShoutouts() {
            $interval.cancel($scope.searchInteval);
        }

        $scope.$on('$destroy', function destroyChatsCtrlScope() {
            $scope.stopSearchingAreaForShoutouts();
        });

        $scope.$on("geo:search", function onGeoSearch (event, latLon, radius, shouts) {
            $scope.chats = [];
            $scope.$apply(function() {
                for (var i = 0; i < shouts.length; i++) {
                    var shout = shouts[i];
                    var distance = getDistanceFromLatLonInKm(shout.location[0], shout.location[1],
                        _currentlocation[0], _currentlocation[1]);
                    var color = 'gray';

                    if (distance > 1) {
                        distance = (Math.round(distance * 10)/10) + " km away";
                    } else if (distance > 0 && distance < 1) {
                        distance = (distance * 1000) + " m away";
                        color = 'black';
                    } else {
                        distance = "shoutout is right next to you!";
                        color = 'red';
                    }

                    angular.extend(shout, {
                        distance: distance,
                        color: color
                    });

                    $scope.chats.push(shout);
                }

                $scope.$broadcast('scroll.refreshComplete');
            });
        });

        $scope.startSearchingAreaForShoutouts();
    })

    .controller('MyChatsCtrl', function ($scope, $firebase) {
        $scope.chats = [];

        if (!angular.isDefined(_currentuser))
            return;

        var chatIdListRef = new Firebase(BASE_URL + "/users/"+getCurrentUserID() + "/chatIdList");
        chatIdListRef.on("value", function(snapshot) {
            snapshot.forEach(function(chatListItem) {
                var chatVal = $firebase(new Firebase(BASE_URL + "/chats/geoFire/dataById/" + chatListItem.val().chatId));

                $scope.chats.push(chatVal);
            });
        });
    })

    .controller('ViewChatCtrl', function ($scope, $rootScope, $ionicLoading, $ionicScrollDelegate, $firebase, $stateParams) {
        var postsRef = new Firebase(BASE_URL + "/chats/geoFire/dataById/" + $stateParams.chatId + "/posts");
        $scope.posts = $firebase(postsRef);

        $scope.newChatPost = function() {
            if ($scope.newpost && $scope.newpost.length > 0) {
                log.info("Posting: " + $scope.newpost + ", chatid: " + $stateParams.chatId);
                $rootScope.postToChat(angular.copy($scope.newpost), $stateParams.chatId);
                $scope.newpost = "";
            }
        }

        $scope.trySubmit = function($event) {
            if ($event.keyCode == '13') {
                $scope.newChatPost();
            }
        }

        postsRef.on("child_added", function() {
            log.info("child added");
            $ionicScrollDelegate.scrollBottom();
        });
    })

    .controller('NewChatCtrl', function ($scope, $rootScope, $ionicLoading, $state, $geofire, $stateParams, $window) {
        $scope.newChat = function () {
            $scope.loading = $ionicLoading.show({
                content: 'Creating chat..'
            });

            var chatsRef = new Firebase(BASE_URL + "/chats");
            var geo = $geofire (chatsRef);

            var chat = {
                id: getCurrentUserID() + "_" + new Date().getTime(),
                title: $scope.title,
                createdByAlias: getCurrentUserAlias(),
                createdByID: getCurrentUserID(),
                location: _currentlocation,
                posts: []
            };

            geo.$insertByLocWithId(_currentlocation, chat.id, chat).catch(
                function(err) {
                    $ionicPopup.alert({
                        title: 'Failed',
                        content: err
                    });
                }
            ).then(function() {
                var userRef = new Firebase(BASE_URL + "/users/"+getCurrentUserID());
                userRef.child("chatIdList").push({
                    chatId: chat.id
                });

                $rootScope.postToChat($scope.post, chat.id);
                $state.go("app.viewchat", {chatId: chat.id});

                $scope.loading.hide();
            });
        }

        $scope.back = function () {
            $window.history.back();
        }
    })

    .controller('SettingsCtrl', function ($scope, $firebase) {
        var userRef = new Firebase(BASE_URL + "/users/" + getCurrentUserID());
        $scope.user = $firebase(userRef);

        $scope.updateRadius = function() {
            log.info("updating radius to: " + $scope.user.radius);
            userRef.child("radius").set($scope.user.radius);
        }
    })