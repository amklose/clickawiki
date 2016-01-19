(function() {
    angular.module("clickawiki", []);
})();
(function() {
    angular.module("clickawiki").constant("constants", {
        ///firebaseURL: "https://quicktest1.firebaseio.com/wiki",
        useWebServer: false,
        firebaseURL: "https://apiwiki.firebaseio.com",
        headerTitle: "Clickawiki",
        defaultDeleteMessage: "Are you sure you want to delete this? ",
        types: ["ArrayList", "Boolean", "Integer", "Double", "Number", "Object", "String", "Void"],
        path: {
            templatePath: "/assets/templates/"
        },
        auth: {
            email: "admin@admin.com"
        },
        popUpDeleteSettings: {
            title: "Are you sure?",
            text: "",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#5cb85c",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "No, cancel!",
            closeOnConfirm: false,
            closeOnCancel: false
        },
        loginPromptSettings: {
            title: "Login",
            text: "Please provide your access code:",
            type: "input",
            inputType: "password",
            showCancelButton: true,
            closeOnConfirm: false,
            animation: "slide-from-top",
            inputValue: "click",
            inputPlaceholder: "Acess code..."
        }
    });
})();
(function() {
    angular.module("clickawiki").factory("authFactory", authFactory);
    authFactory.$inject = ["firebaseFactory", "constants"];

    function authFactory(firebaseFactory, constants) {
        return {
            loginPrompt: loginPrompt,
            getAuth: getAuth,
            logout: logout,
            login: login
        };

        function getAuth() {}

        function logout(ref) {
            return ref.unauth();
        }

        function loginPrompt(inputValue) {
            if (inputValue === false) return false;
            if (inputValue === "") {
                swal.showInputError("You need to enter your access code!");
                return false;
            }
            swal.close();
            login(firebaseFactory.getRef(), null, inputValue);
        }

        function login(ref, u, p, token) {
            if (!token) {
                u = u || constants.auth.email;
                var auth = {};
                auth.email = u;
                auth.password = p;
                ref.authWithPassword(auth, loginResponse);
            } else {
                ref.authWithCustomToken(token, loginResponse);
            }

        }

        function loginResponse(err, authData) {
            if (err) {
                swal("Login Failure", err, "error");
                console.log(err);
            }
        }
    }
})();
(function() {
    angular.module("clickawiki").factory("classFactory", classFactory);
    classFactory.$inject = [];

    function classFactory() {
        return {
            addClass: addClass,
            removeClass: removeClass,
            updateClass: updateClass,
            makeNewClass: makeNewClass
        };

        function makeNewClass(className) {
            return {
                name: className
            };
        }

        function addClass(ref, className) {
            ref.push(makeNewClass(className), handleReturn);
        }

        function removeClass(ref, id) {
            ref.child(id).remove(handleReturn);
        }

        function updateClass(ref, id, val) {
            ref.child(id).update(val, handleReturn);
        }

        function handleReturn(err) {
            return err ? console.log(err) : true;
        }
    }
})();
(function() {
    angular.module("clickawiki").factory("firebaseFactory", firebaseFactory);
    firebaseFactory.$inject = ["constants"];

    function firebaseFactory(constants) {
        var ref = new Firebase(constants.firebaseURL);

        return {
            getRef: getRef,
            update: update
        };

        function getRef() {
            return ref;
        }

        function update(data) {
            ref.set(data, function(err) {
                return err || "complete";
            });
        }
    }
})();
(function() {
    angular.module("clickawiki").factory("helperFactory", helperFactory);
    helperFactory.$inject = ["constants"];

    function helperFactory(constants) {
        return {
            checkForEnterPress: checkForEnterPress,
            confirmDelete: confirmDelete
        };

        function checkForEnterPress(evt) {
            return evt && evt.keyCode === 13 ? true : false;
        }

        function confirmDelete(msg, partial, callback) {
            var popup = constants.popUpDeleteSettings;
            msg = partial ? constants.defaultDeleteMessage + "(" + msg + ")" : msg;
            msg = msg || constants.defaultDeleteMessage;
            popup.text = msg;
            swal(popup, function(isConfirm) {
                if (isConfirm) {
                    swal("Deleted!", "", "success");
                    callback(true);
                } else {
                    swal("Cancelled", "you've stopped it!", "error");
                    callback();
                }
            });
        }
    }
})();
(function() {
    angular.module("clickawiki").factory("methodFactory", methodFactory);
    methodFactory.$inject = [];

    function methodFactory() {
        return {
            addMethod: addMethod,
            removeMethod: removeMethod,
            updateMethod: updateMethod
        };

        function addMethod(ref, key, val) {
            ref.child(key).child("methods").push(val, handleReturn);
        }

        function removeMethod(ref, classKey, key) {
            ref.child(classKey).child("methods").child(key).remove(handleReturn);
        }

        function updateMethod(ref, key, methodKey, val) {
            ref.child(key).child("methods").child(methodKey).set(val, handleReturn);
        }

        function handleReturn(err) {
            return err ? console.log(err) : true;
        }
    }
})();
(function() {
    angular.module("clickawiki").controller("mainController", mainController);
    mainController.$inject = ["$timeout", "constants", "firebaseFactory", "classFactory", "methodFactory", "helperFactory", "authFactory"];

    function mainController($timeout, constants, firebaseFactory, classFactory, methodFactory, helperFactory, authFactory) {
        var vm = this;
        /*Set db reference*/
        var ref = firebaseFactory.getRef();
        /*Set some defaults*/
        vm.headerTitle = constants.headerTitle;
        vm.returnTypes = constants.types;
        vm.formTitleText = "New";
        vm.editModeActive = false;
        vm.isLoggedIn = false;
        vm.allClasses = [];
        // vm.displayMethodForm = false;
        /*Set listener for db changes*/
        ref.on("value", handleDataUpdate);
        ref.onAuth(function(auth) {
            $timeout(function() {
                vm.isLoggedIn = auth ? true : false;
                if (localStorage && auth) {
                    localStorage.setItem("cw_token", auth.token);
                }
            });
        });

        if (localStorage && localStorage.getItem("cw_token")) {
            var token = localStorage.getItem("cw_token");
            authFactory.login(ref, null, null, token);
        }
        /*template exposed functions*/

        //for classes
        vm.addNewClass = addNewClass;
        vm.removeClass = removeClass;
        vm.updateClass = updateClass;
        vm.selectClass = selectClass;
        //search
        vm.search = search;
        //for methods associated with classes
        vm.addNewMethod = addNewMethod;
        vm.removeMethod = removeMethod;
        vm.updateMethod = updateMethod;
        //for attributes associated with methods
        vm.addMethodAttribute = addMethodAttribute;
        vm.removeMethodAttribute = removeMethodAttribute;
        //extra stuff
        vm.checkForEnter = checkForEnter;
        vm.setEditClassName = setEditClassName;
        vm.displayAddNewMethod = displayAddNewMethod;
        vm.cancelMethodForm = cancelMethodForm;
        vm.resetMethodForm = resetMethodForm;


        vm.loginPrompt = loginPrompt;
        vm.logOut = logOut;
        
        function logOut(ev) {
            ev.preventDefault();
            return authFactory.logout(ref);
        }


        function loginPrompt(ev) {
            ev.preventDefault();
            swal(constants.loginPromptSettings, authFactory.loginPrompt);
        }

        /*Action for db update*/
        function handleDataUpdate(snap) {
            $timeout(function() {
                vm.allClasses = snap.val() || {};
            });
        }

        /*controller class functions*/
        function addNewClass(className) {
            if (className) {
                classFactory.addClass(ref, className);
                vm.newClassName = "";
            }
        }

        function removeClass(id) {
            helperFactory.confirmDelete("", false, response)

            function response(confirm) {
                if (confirm && id) {
                    classFactory.removeClass(ref, id);
                    vm.selectedClass = null;
                }
            }
        }

        function updateClass(classObj) {
            if (classObj && classObj.val.name.length > 0) {
                classFactory.updateClass(ref, classObj.key, classObj.val);
            }
        }

        //search
        function search(searchTerm) {
            // TODO: All the hard stuff...
            console.log("Searching for '" + searchTerm + "'");
        }

        //handles when a class is selected
        function selectClass(key, val) {
            vm.formTitleText = "New";
            vm.selectedClass = {};
            vm.selectedClass.key = key;
            vm.selectedClass.val = val;
            vm.setEditClassName(false);
            vm.editModeActive = false;
            resetMethodForm();
            angular.element(document).find(".panel-collapse").removeClass("in");
        }

        /*controller method functions*/
        function addNewMethod(method) {
            if (vm.editModeActive) {
                vm.editModeActive = false;
                methodFactory.updateMethod(ref, vm.selectedClass.key, vm.editMethodKey, method);
            } else {
                methodFactory.addMethod(ref, vm.selectedClass.key, method);
                vm.method = {};
                vm.method.returnType = 'Return type';
            }
            vm.displayMethodForm = false;
        }

        function removeMethod(key, ev) {
            ev.stopPropagation();
            if (key) {
                helperFactory.confirmDelete("", "", response);

                function response(confirm) {
                    if (confirm) {
                        methodFactory.removeMethod(ref, vm.selectedClass.key, key);
                    }
                }
            }
        }

        function updateMethod(key, method, ev) {
            ev.stopPropagation();
            vm.displayMethodForm = true;
            vm.formTitleText = "Edit";
            vm.method = method;
            vm.editModeActive = true;
            vm.editMethodKey = key;
        }

        function addMethodAttribute() {
            vm.method.attributes = vm.method.attributes || [];
            vm.method.attributes.push({});
        }

        function removeMethodAttribute(ev, index, attr) {
            ev.preventDefault();
            if (vm.method.attributes) {
                vm.method.attributes.splice(index, 1);
            }
        }

        /*Extra stuff*/
        //handle enter press
        function checkForEnter(evt, val, callback) {
            return helperFactory.checkForEnterPress(evt) ? callback(val) : false;
        }
        //value to show/hide edit class name feature
        function setEditClassName(bool) {
            return (vm.editClass = bool);
        }

        function displayAddNewMethod() {
            vm.editModeActive = false;
            vm.formTitleText = "New";
            resetMethodForm();
            vm.displayMethodForm = !vm.displayMethodForm;
        }

        function cancelMethodForm() {
            vm.displayMethodForm = false;
            vm.formTitleText = "New";
            resetMethodForm();
        }

        function resetMethodForm() {
            vm.method = {};
            vm.method.returnType = 'Return type';
            vm.method.attributes = [];
            vm.displayMethodForm = false;
        }

        vm.filterSecId = function(items) {
            var result = {};
            angular.forEach(items, function(value, key) {
                if (!value.hasOwnProperty('name')) {
                    result[key] = value;
                }
            });
            return result;
        }
    }
})();
(function() {
    angular.module("clickawiki").directive("cwHeader", cwHeader);
    cwHeader.$inject = ["$compile", "constants"];

    function cwHeader($compile, constants) {
        var template = '<nav class="navbar navbar-default"><div class="container"><div class="navbar-header"><button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navcol-1" aria-expanded="false"><span class="sr-only">Toggle navigation</span> <span class="icon-bar"></span> <span class="icon-bar"></span> <span class="icon-bar"></span></button> <a class="navbar-brand navbar-link" href="#">{{vm.headerTitle}}</a></div><div class="collapse navbar-collapse" id="navcol-1"><form class="navbar-form navbar-left" role="search"><div class="form-group"><div class="input-group"><input type="text" class="form-control" placeholder="Search" ng-model="vm.searchTerm"> <span class="input-group-btn"><button class="btn btn-default" type="button"><span class="glyphicon glyphicon-search" aria-hidden="true" ng-click="vm.search(vm.searchTerm)"></span></button></span></div></div></form><ul class="nav navbar-nav"><li ng-if="!vm.isLoggedIn"><a href="#" ng-click="vm.loginPrompt($event)">Log In</a></li><li ng-if="vm.isLoggedIn"><a href="#" ng-click="vm.logOut($event)">Log Out</a></li></ul></div></div></nav>';
        var directive = {
            restrict: "EA",
            transclude: true,
        };
        templateUrl = constants.path.templatePath + "cwHeader.directive.html";

        if (constants.useWebServer) {
            directive.templateUrl = templateUrl;
        } else {
            directive.template = template;
        }

        return directive;
    }
})();
(function() {
	angular.module("clickawiki").filter("methodFilter", methodFilter);

	function methodFilter() {
		console.log("in filter")
		return function(input, search) {
			console.log("in filter")
			if (!input) return input;
			if (!search) return input;
			var expected = ('' + search).toLowerCase();
			var result = {};
			angular.forEach(input, function(value, key) {
				var actual = ('' + value).toLowerCase();
				if (actual.indexOf(expected) !== -1) {
					result[key] = value;
				}
			});
			return result;
		};
	}
})();