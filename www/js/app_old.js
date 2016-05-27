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

.controller('loginCtrl', function($scope, login_serv, $state, $ionicPopup, $ionicLoading) {

    $scope.loginUser = function(data) {

        // Start loading
        $ionicLoading.show({
            template: "Logging in..."
        });

        login_serv.loginUser(data)
        .then(function() {
            $state.go('task_dash');
        })
        .catch(function(error) {
            $ionicPopup.alert({
                title: "Failed to login!",
                template: error
            });
        }).then(function() {
            $ionicLoading.hide();
        });
    }

})

.controller('menuCtrl', function($scope, login_serv, $state, $ionicSideMenuDelegate) {

    $scope.logoutUser = function() {
        login_serv.logout();
    }

    $scope.showMenu = function() {
        $ionicSideMenuDelegate.toggleLeft();
    }

})

.controller('taskCtrl', function($scope, auth, $state, task_serv, $ionicPopup, $ionicLoading, login_serv) {

    // This is a protected route
    auth.checkAuth();

    // Function used to get tasks
    $scope.getTasks = function() {

        // Start loading
        $ionicLoading.show({
            template: "Getting tasks..."
        });

        task_serv.get()
        .then(function(tasks) {
            $scope.tasks = tasks;
        })
        .catch(function(error) {
            $ionicPopup.alert({
                title: "Failed to get tasks!",
                template: error
            });
        })
        .then(function() {
            $ionicLoading.hide();
        });
    }

    // Getting tasks
    $scope.getTasks();

})

.factory('httpInterceptor', function($q) {

    var authToken = window.localStorage.getItem("auth-token");

    return {
        request: function(config) {
            if (config.method === "GET") {
                config.headers = {
                    'x-access-token': authToken,
                    'Content-Type': 'application/json'
                }
            }
            return $q.resolve(config);
        },
        requestError: function(rejection) {
            return $q.reject(rejection);
        },
        response: function(response) {
            return $q.resolve(response);
        },
        responseError: function(rejection) {
            if (rejection.status === 401) { // Token expired
                return $q.reject(rejection);
            }
            return $q.reject(rejection);
        }
    }
})

.factory('task_serv', function($q, $http, $state) {
    return {
        get: function() {
            // Preparing the promise
            var q = $q.defer();
            // Sending http GET to get tasks for the user
            $http.get("http://192.168.0.21:1337/api/tasks")
            .then(function(response) {
                q.resolve("response");
            })
            .catch(function(error) {
                q.reject("error");
            })

            // Returning promise
            return q.promise;
        }
    }
})

.factory('auth', function($state, $q, $http) {
    return {
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
            // Used to check that the User has a token
            var token = window.localStorage.getItem("auth-token");
            if (token === null) {
                $state.go('login');
            } else {
                return token; // Used for when other functions call it
            }
        },
        setToken: function(token) {
            // Setting the token
            var q = $q.defer();
            // Checking the token
            if (typeof token === 'undefined' || token === null) {
                q.reject("No token provided...");
            } else if (token) {
                // Setting the token
                window.localStorage['auth-token'] = token;
                // Checking that the token has been set
                this.checkToken().
                then(function(result) {
                    if (result === true) {
                        q.resolve();
                    } else if (result === false) {
                        q.reject("Failed to set token!");
                    }
                })
            }
            // Returning promise
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

.factory('login_serv', function($q, $state, auth, $http, $ionicSideMenuDelegate, $ionicPopup) {
    return {
        loginUser: function(login_data) {
            // Creating the promise
            var q = $q.defer();

            // Sending the data to API
            var user_info = {
                email: login_data.email,
                password: login_data.password
            }

            // Logging user in
            $http.post('http://192.168.0.21:1337/api/auth', user_info)
            .then(function(response) {
                auth.setToken(response.data.token)
                .then(function() {
                    q.resolve();
                })
                .catch(function(error) {
                    q.reject(error);
                })
            })
            .catch(function(error) {
                q.reject(error);
            })

            // Returning the promise
            return q.promise;
        },
        logout: function() {
            // Creating the promise
            var q = $q.defer();
            // Logging them out
            auth.unsetToken().
            then(function(){
                $ionicSideMenuDelegate.toggleLeft(false);
                $state.go('login');
                q.resolve();
            })
            .catch(function(error) {
                $ionicPopup.alert({
                    title: "Something went wrong!",
                    template: error
                });
                q.reject();
            })
            // Returning promise
            return q.promise;
        }
    }
})
