/**
 * Created by dbreuer83 on 24/10/15.
 */

function Weather() {
    var apiKey = "";

    this.setApiKey = function (key) {
        if (key) this.apiKey = key;
    };
    this.getUrl = function (type, ext) {
        return "app/modules/weather/London.json";
        //return "http://api.wunderground.com/api/" +
        //this.apiKey + "/" + type + "/q/" +
        //ext + '.json';
    };

    this.$get = function ($q, $http, $timeout) {
        var self = this;
        return {
            getWeatherForecast: function (city) {
                var d = $q.defer();
                $http({
                    method: 'GET',
                    url: self.getUrl("forecast10day", city),
                    cache: true
                }).success(function (data) {
                    // The wunderground API returns the
                    // object that nests the forecasts inside
                    // the forecast.simpleforecast key
                    d.resolve(data.forecast.simpleforecast);
                }).error(function (err) {
                    d.reject(err);
                });
                return d.promise;
            }
        }
    }
}


function config(WeatherProvider) {
    WeatherProvider.setApiKey('e74d6a5dfc3a56e7');
}
function weatherController(Weather) {
    var we = this;
    we.weather = {};
    we.user = {
        location: 'UK/London'
    };

    Weather.getWeatherForecast("UK/London")
        .then(function (data) {
            we.weather.forecast = data;
        });
}
function weatherModule() {
    var directive = {
        link: link,
        transclude: true,
        scope: {limit: '@'},
        templateUrl: './app/modules/weather/weather_module.tpl.html',
        restrict: 'EA',
        controller: 'weatherController',
        controlerAs: 'we'
    };
    return directive;

    function link(scope, element, attrs) {
        /* */
    }
}





angular
    .module('smile.weather', [
        'ngRoute',
        'ngAnimate',
        'geolocation'
    ])
    .config(config)
    .controller('weatherController', weatherController)
    .directive('weatherModule', weatherModule)
    .provider('Weather', Weather);