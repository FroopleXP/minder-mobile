// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('minder', ['ionic'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

// Routing
.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider

    .state('login', {
        url: '/login',
        templateUrl: 'templates/login.html',
        controller: 'loginCtrl',
        cache: false
    })

    .state('task_dash', {
        url: '/task_dash',
        templateUrl: 'templates/task_dash.html',
        controller: 'taskCtrl',
        cache: false
    })

    $urlRouterProvider.otherwise('/login');

})

.controller('loginCtrl', function($scope, login_serv, $state) {

    $scope.loginUser = function(data) {
        login_serv.loginUser(data)
        .then(function() {
            $state.go('task_dash');
        })
        .catch(function(error) {
            console.log(error);
        });
    }

})

.controller('menuCtrl', function($scope, login_serv, $state, $ionicSideMenuDelegate) {

    $scope.logoutUser = function() {
        login_serv.logout()
        .then(function() { // Success
            $ionicSideMenuDelegate.toggleLeft(false);
            $state.go('login');
        })
        .catch(function(error){ // Failure
            console.log(error);
        })
    }

    $scope.showMenu = function() {
        $ionicSideMenuDelegate.toggleLeft();
    }

})

.controller('taskCtrl', function($scope, auth) {

    // This is a protected route
    auth.checkAuth();

    $scope.tasks = [
        { class: "Computer Science", task: "Do work!" },
        { class: "Electronics", task: "Try not to make fun of my head." },
        { class: "Engineering", task: "Do assignment D1" }
    ];

})

.factory('auth', function($state, $q) {
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
        injectToken: function() {
            // Getting the token
            var token = checkAuth;
            return token;
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

.factory('login_serv', function($q, $state, auth) {
    return {
        loginUser: function(login_data) {
            // Creating the promise
            var q = $q.defer();
            // Sending the data to API
            if (login_data.email === "connor@frooplexp.com" && login_data.password === "letmein") {
                // Setting the cookie
                auth.setToken(login_data.email)
                .then(function() {
                    q.resolve();
                })
                .catch(function(error) {
                    q.reject(error);
                })
            } else {
                q.reject("Failed to login!");
            }
            // Returning the promise
            return q.promise;
        },
        logout: function() {
            // Creating the promise
            var q = $q.defer();
            // Logging them out
            auth.unsetToken().
            then(function(){
                console.log("Logged out...");
                q.resolve();
            })
            .catch(function(error) {
                q.reject(error);
            })
            // Returning promise
            return q.promise;
        }
    }
})
