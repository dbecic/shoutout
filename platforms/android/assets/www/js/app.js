// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['starter.controllers'])

    .run(function ($ionicPlatform, $ionicLoading, $ionicPopup) {
        $ionicPlatform.ready(function () {
            console.log("ionic ready console log");
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
    })

    .config(function ($stateProvider, $urlRouterProvider, $httpProvider) {
        console.log("config init");

        $stateProvider

            .state('app', {
                url: "/app",
                abstract: true,
                templateUrl: "templates/menu.html",
                controller: 'AppCtrl'
            })

            .state('app.login', {
                url: "/login",
                views: {
                    'menuContent': {
                        templateUrl: "templates/login.html"
                    }
                }
            })

            .state('app.settings', {
                url: "/settings",
                views: {
                    'menuContent': {
                        templateUrl: "templates/settings.html"
                    }
                }
            })

            .state('app.logout', {
                url: "/logout",
                views: {
                    'menuContent': {
                        templateUrl: "templates/login.html",
                        controller: 'LogoutCtrl'
                    }
                }
            })

            .state('app.chats', {
                url: "/chats",
                views: {
                    'menuContent': {
                        templateUrl: "templates/areachats.html"
                    }
                }
            })

            .state('app.mychats', {
                url: "/mychats",
                views: {
                    'menuContent': {
                        templateUrl: "templates/mychats.html"
                    }
                }
            })

            .state('app.register', {
                url: "/register",
                views: {
                    'menuContent': {
                        templateUrl: "templates/register.html"
                    }
                }
            })

            .state('app.viewchat', {
                url: "/chats/{chatId}",
                views: {
                    'menuContent': {
                        templateUrl: "templates/chat.html"
                    }
                }
            })

            .state('app.newchat', {
                url: "/newchat",
                views: {
                    'menuContent': {
                        templateUrl: "templates/newchat.html"
                    }
                }
            });
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/login');
    });