//app.js
/**
 * Created by David Breuer on 02/09/15.
 *
 * @file app.js
 * @description
 *
 */
(function () {



    function smileCtrl(backgroundService, geolocation, $sce, $scope, $timeout) {
        var sc = this;

        // Build the date object
        $scope.date = {};
        sc.timeformat = 'hh:mm:ss';
        sc.timeformatChange = function () {
            sc.timeformat = (sc.timeformat === 'hh:mm:ss') ? 'h:mm a' : 'hh:mm:ss';
        };

        sc.dateformat = 'EEEE, MMMM d, yyyy';
        sc.dateformatChange = function () {
            sc.dateformat = (sc.dateformat === 'EEEE, MMMM d, yyyy') ? 'dd/MM/yyyy' : 'EEEE, MMMM d, yyyy';
        };
        // Update function
        var updateTime = function () {
            $scope.date.raw = new Date();
            $timeout(updateTime, 1000);
        };

        // Kick off the update function
        updateTime();


        sc.backgroundImage = null;
        sc.template = '/welcome.html';
        sc.dataModel = {};
        sc.MostVisitedURL = null;
        sc.dataModel.step = 0;


        function topSites() {

            chrome.topSites.get(function (MostVisitedURL) {
                console.log("MostVisitedURL", MostVisitedURL);
                sc.MostVisitedURL = MostVisitedURL.slice(0, 5);
            });

        }

        function submitData() {
            sc.dataModel.step++;
            console.log(inroForm.userName);
            if (inroForm.userName) {
                console.log(inroForm.userName.$error, inroForm.userName.$valid)
            }
        }

        function init() {
            sc.topSites();
            backgroundService.then(function (data) {
                var index = Math.floor((Math.random() * data.backgrounds.length + 1));
                sc.backgroundImage = chrome.extension.getURL(data.backgrounds[index - 1].filename);
            });
        }

        sc.submitData = submitData;
        sc.topSites = topSites;
        sc.init = init;

        sc.init();


    }

    function backgroundService($q, $http) {
        return $q(function (resolve, reject) {

            $http.get(chrome.extension.getURL('app/backgrounds.json')).then(function (data) {
                resolve(data.data);
            }, function (err) {
                reject('error');
            })
        })
    }


    function ngEnter($timeout) {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    $timeout(function () {
                        scope.$eval(attrs.ngEnter);
                    }, 0);

                    event.preventDefault();
                }
            });
        };
    }

    function includeReplace() {
        return {
            require: 'ngInclude',
            restrict: 'A', /* optional */
            link: function (scope, el, attrs) {
                el.replaceWith(el.children());
            }
        };
    }

    function config($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'templates/home.html',
                controller: 'smileCtrl'
            })
            .when('/settings', {
                templateUrl: 'templates/settings.html',
                controller: 'SettingsCtrl'
            })
            .otherwise({redirectTo: '/'});

    }

    function SettingsCtrl($scope, UserService) {
        var us = this;
        us.user = UserService.user;
        us.selectedTabsValue = 'account';
        us.MostVisitedURL = [];
        us.selectTab = selectTab;
        us.topSites = topSites;

        function selectTab(e) {
            console.log('clicked', e);
            us.selectedTabsValue = (e) ? e : false;
        }

        function topSites() {
            if (us.MostVisitedURL.length < 5) {
                chrome.topSites.get(function (MostVisitedURL) {
                    console.log("MostVisitedURL", MostVisitedURL);
                    us.MostVisitedURL = MostVisitedURL.slice(0, 5);
                });
            }
        }

    }

    function UserService() {
        var defaults = {
            location: 'autoip'
        };

        var service = {
            user: {},
            save: function () {
                sessionStorage.presently =
                    angular.toJson(service.user);
            },
            restore: function () {
                // Pull from sessionStorage
                service.user =
                    angular.fromJson(sessionStorage.presently) || defaults

                return service.user;
            }
        };
        // Immediately call restore from the session storage
        // so we have our user data available immediately
        service.restore();
        return service;
    }

    angular.module('smile', [
        'ngRoute',
        'ngAnimate',
        'angular-cache',
        'geolocation',
        'smile.weather',
        'smile.bookmark'

    ])
        .config(config)
        .controller('smileCtrl', smileCtrl)
        .controller('SettingsCtrl', SettingsCtrl)
        .factory('UserService', UserService)
        .service('backgroundService', backgroundService)
        .directive('ngEnter', ngEnter)
        .directive('includeReplace', includeReplace);

})();