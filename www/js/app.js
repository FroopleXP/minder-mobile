//////////////////////////////////////////////////////////////
///
///     MINDER MOBILE
///     WRITTEN BY: CONNOR EDWARDS
///     DATE: 24/5/16
///     (c) Noval Studios, 2016 -
///     MIT License (MIT) | Open Source Initiative
///
//////////////////////////////////////////////////////////////

angular.module('minder', ['ionic'])

.run(function($ionicPlatform, $http) {
    $ionicPlatform.ready(function() {
        if(window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if(window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
})

// Routing
.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

    $stateProvider

    .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'loginCtrl'
    })

    .state('task_dash', {
        url: '/task_dash',
        templateUrl: 'templates/task_dash.html',
        controller: 'taskCtrl',
        cache: false
    })

    $urlRouterProvider.otherwise('/login');
    $httpProvider.interceptors.push('httpInterceptor');

})

// Controllers
.controller('menuCtrl', function($scope, $ionicSideMenuDelegate, loginServ) {
    // Toggle the menu
    $scope.toggleMenu = function() {
        $ionicSideMenuDelegate.toggleLeft();
    }
    $scope.logout = function() {
        loginServ.logout();
    }
})

.controller('taskCtrl', function($scope, auth, $state) {
    auth.checkAuth()
    .then(function() {

    })
    .catch(function() {
        $state.go('login');
    })
})

.controller('loginCtrl', function($scope, loginServ, $state) {
    // Function to login user
    $scope.login = function(logindata) {
        loginServ.login(logindata);
    }
})

// loginServ
.factory('loginServ', function($q, $http, $state, $ionicPopup, auth) {
    return {
        login: function(login) {
            $http.post("http://client.minder.noval-technologies.uk/api/auth", login)
            .then(function(response){
                auth.setToken(response.data.token)
                .then(function() {
                    $state.go('task_dash');
                })
                .catch(function(err) {
                    $ionicPopup.alert({
                        title: "Failed to login!",
                        template: err
                    })
                })
            })
            .catch(function(err) {
                $ionicPopup.alert({
                    title: "Failed to login!",
                    template: err.message
                })
            })
        },
        logout: function() {
            // Logging the user out
            auth.unsetToken()
            .then(function() {
                $state.go('login');
            })
            .catch(function(err){
                $ionicPopup.alert({
                    title: "Failed to logout!",
                    template: err
                })
            })
        }
    }
})

.factory('auth', function($q, $state) {
    return {
        setToken: function(token_to_set) {
            // Creating the promise
            var q = $q.defer();
            // Setting the token
            window.localStorage['auth-token'] = token_to_set;
            // Checking that the token is set
            this.checkToken()
            .then(function() {
                q.resolve();
            })
            .catch(function() {
                q.reject("Failed to set token!");
            })
            return q.promise;
        },
        checkToken: function() {
            // Used to check if the token is set
            var q = $q.defer();
            // Checking the token
            var token = window.localStorage.getItem("auth-token");
            if (token === null) {
                q.resolve(false);
            } else if (token) {
                q.resolve(true);
            }
            // Sending back to promise
            return q.promise;
        },
        checkAuth: function() {
            // Creating the promise
            var q = $q.defer();
            // Checking that the user is logged in
            this.checkToken()
            .then(function(cb) {
                if (cb === true) {
                    q.resolve();
                } else if (cb === false) {
                    $state.go('login');
                }
            })
            return q.promise;
        },
        unsetToken: function() {
            // Deleting the token
            var q = $q.defer();
            window.localStorage.removeItem("auth-token");
            // Check if it has
            this.checkToken()
            .then(function(result) {
                if (result === true) {
                    q.reject("Failed to unset token!");
                } else if (result === false) {
                    q.resolve();
                }
            })
            return q.promise;
        }
    }
})

// HTTP interceptor
.factory('httpInterceptor', function($q) {
    return {
        request: function(control) {
            return $q.resolve(control);
        },
        requestError: function(rejection) {
            return $q.reject(rejection);
        },
        response: function(response) {
            return $q.resolve(response);
        },
        responseError: function(rejection) {
            // Checking the response
            if (rejection.status === -1) { // Lost connection
                rejection.message = "Lost connection!";
            } else if (rejection.status === 401) {
                rejection.message = "Token has expired";
            } else if (rejection.status === 400) {
                rejection.message = "API Could not be found :(";
            } else {
                rejection.message = rejection.data.message;
            }
            return $q.reject(rejection);
        }
    }
})
