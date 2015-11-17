/**
 * Created by dbreuer83 on 27/10/15.
 */
//

function bookmarkController(BookmarkService){
    var bc = this;
    bc.callback = function(result){
        console.log(result);
    };

    BookmarkService.search('aat').then( function(result){
        bc.bookmarksList = result;
    })
}

function BookmarkService($q, $http, $timeout, CacheFactory){
    CacheFactory('dataCache', {
        maxAge: 15 * 60 * 1000, // Items added to this cache expire after 15 minutes
        cacheFlushInterval: 60 * 60 * 1000, // This cache will clear itself every hour
        deleteOnExpire: 'aggressive', // Items will be deleted from this cache when they expire
        storageMode: 'localStorage' // This cache will use `localStorage`.
    });
    var allResult = [];
    var i =0;
    return {
        search: function (query) {
            return $q(function (resolve, reject) {
                var dataCache = CacheFactory.get('dataCache');
                if (dataCache.get('bookmarks')) {
                    resolve(dataCache.get('bookmarks'));
                } else {
                    chrome.bookmarks.getTree(function(itemTree){
                        itemTree.forEach(function(item){
                            processNode(item);
                        });
                        resolve(allResult);
                        dataCache.put('bookmarks', allResult);
                    });

                }

                function processNode(node) {

                    // recursively process child nodes
                    if(node.children) {
                        node.children.forEach(function(child) { processNode(child); });
                    }

                    // print leaf nodes URLs to console
                    if(node.url) {
                        console.log(findWithAttr(allResult, 'url', node.url));
                        if (findWithAttr(allResult, 'url', node.url) === -1) {
                            allResult.push(node);
                        }
                    }
                }
            })
        }
    }
}

function bookmarkSearchModule(){
    var directive = {
        link: link,
        transclude: true,
        scope: {limit: '@'},
        templateUrl: './app/modules/bookmark/bookmark_module.tpl.html',
        restrict: 'EA',
        controller: 'bookmarkController',
        controlerAs: 'bc'
    };
    return directive;

    function link(scope, element, attrs) {
        /* */
    }
}

function typeahead($compile, $timeout)   {
    return {
        restrict: 'A',
        transclude: true,
        scope: {
            ngModel: '=',
            typeahead: '=',
            typeaheadCallback: "="
        },
        link: function(scope, elem, attrs) {
            var template = '<div class="dropdown"><ul class="dropdown-menu" style="display:block;" ng-hide="!ngModel.length || !filitered.length || selected"><li ng-repeat="item in filitered = (typeahead | filter:{title:ngModel} | limitTo:5) track by $index" ng-click="click(item)" style="cursor:pointer" ng-class="{active:$index==active}" ng-mouseenter="mouseenter($index)"><a title="{{item.url}}">{{item.title}}</a></li></ul></div>'

            elem.bind('blur', function() {
                $timeout(function() {
                    if (scope.selected.url) {
                        window.location.replace(scope.selected.url);
                    }
                    scope.selected = true;
                }, 100)
            });

            elem.bind("keydown", function($event) {
                console.log(scope);
                if($event.keyCode == 38 && scope.active > 0) { // arrow up
                    scope.active--
                    scope.$digest()
                } else if($event.keyCode == 40 && scope.active < scope.filitered.length - 1) { // arrow down
                    scope.active++
                    scope.$digest()
                } else if($event.keyCode == 13) { // enter
                    scope.$apply(function() {
                        scope.click(scope.filitered[scope.active])
                    })
                }
            });

            scope.click = function(item) {
                scope.ngModel = item.title;
                scope.selected = item;
                if(scope.typeaheadCallback) {
                    scope.typeaheadCallback(item)
                }
                elem[0].blur();

            };

            scope.mouseenter = function($index) {
                scope.active = $index
            };

            scope.$watch('ngModel', function(input) {
                if(scope.selected && scope.selected.title == input) {
                    return
                }

                scope.active = 0;
                scope.selected = false;

                // if we have an exact match and there is only one item in the list, automatically select it
                if(input && scope.filitered.length == 1 && scope.filitered[0].title.toLowerCase() == input.toLowerCase()) {
                    scope.click(scope.filitered[0])
                }
            });

            elem.after($compile(template)(scope))
        }
    }
}

angular
    .module('smile.bookmark', [
        'ngRoute',
        'ngAnimate'
    ])
    .factory('BookmarkService', BookmarkService)
    .controller('bookmarkController', bookmarkController)
    .directive('bookmarkSearchModule', bookmarkSearchModule)
    .directive('typeahead', typeahead);

function findWithAttr(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {

        if(array[i][attr] == value) {
            console.log(array[i][attr], value);
            return i;
        }
    }
    return -1;
}