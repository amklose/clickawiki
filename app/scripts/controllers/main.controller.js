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
        vm.allClasses = [];
        // vm.displayMethodForm = false;
        /*Set listener for db changes*/
        ref.on("value", handleDataUpdate);
        ref.onAuth(function(auth) {
            console.log("checking auth: ", auth)
            if (localStorage && auth) {
                localStorage.setItem("cw_token", auth.token);
            }
        });

        if (localStorage.getItem("cw_token")) {
            var token = localStorage.getItem("cw_token");
            authFactory.login(ref, null, null, token);
        }
        /*template exposed functions*/

        //for classes
        vm.addNewClass = addNewClass;
        vm.removeClass = removeClass;
        vm.updateClass = updateClass;
        vm.selectClass = selectClass;
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



        function loginPrompt() {
            swal(constants.loginPromptSettings, authFactory.loginPrompt);
        }

        /*Action for db update*/
        function handleDataUpdate(snap) {
            $timeout(function() {
                console.log("handleDataUpdate() ", snap.val());
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
        //handles when a class is selected
        function selectClass(key, val) {
            vm.formTitleText = "New";
            vm.selectedClass = {};
            vm.selectedClass.key = key;
            vm.selectedClass.val = val;
            vm.setEditClassName(false);
            resetMethodForm();
            angular.element(document).find(".panel-collapse").removeClass("in")
            console.log()
        }

        /*controller method functions*/
        function addNewMethod(method) {
            methodFactory.addMethod(ref, vm.selectedClass.key, method);
            vm.method = {};
            vm.method.returnType = 'Return type';
            vm.displayMethodForm = false;
        }

        function removeMethod(key) {
            console.log(key, vm.selectedClass)
            if (key) {
                helperFactory.confirmDelete("", "", response);
                function response(confirm) {
                    if (confirm) {
                        methodFactory.removeMethod(ref, vm.selectedClass.key, key);
                    }
                }
            }
        }

        function updateMethod(method) {
            vm.displayMethodForm = true;
            vm.formTitleText = "Edit";
            vm.method = method;
            console.log(method);
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
    }
})();