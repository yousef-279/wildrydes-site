/*global WildRydes _config AmazonCognitoIdentity AWSCognito*/

var WildRydes = window.WildRydes || {};

(function scopeWrapper($) {
    var signinUrl = '/signin.html';

    var poolData = {
        UserPoolId: _config.cognito.userPoolId,
        ClientId: _config.cognito.userPoolClientId
    };

    var userPool;

    if (!(_config.cognito.userPoolId &&
          _config.cognito.userPoolClientId &&
          _config.cognito.region)) {
        $('#noCognitoMessage').show();
        return;
    }

    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    if (typeof AWSCognito !== 'undefined') {
        AWSCognito.config.region = _config.cognito.region;
    }

    /* =====================
       Auth helpers
    ====================== */

    WildRydes.signOut = function signOut() {
        var user = userPool.getCurrentUser();
        if (user) {
            user.signOut();
        }
    };

    WildRydes.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        var cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    reject(err);
                } else if (!session.isValid()) {
                    resolve(null);
                } else {
                    resolve(session.getIdToken().getJwtToken());
                }
            });
        } else {
            resolve(null);
        }
    });

    /* =====================
       Cognito functions
    ====================== */

    function register(email, password, onSuccess, onFailure) {
        var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'email',
            Value: email
        });

        userPool.signUp(
            email,
            password,
            [attributeEmail],
            null,
            function signUpCallback(err, result) {
                if (err) {
                    onFailure(err);
                } else {
                    onSuccess(result);
                }
            }
        );
    }

    function signin(email, password, onSuccess, onFailure) {
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password
        });

        var cognitoUser = new AmazonCognitoIdentity.CognitoUser({
            Username: email,
            Pool: userPool
        });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: onSuccess,
            onFailure: onFailure
        });
    }

    function verify(email, code, onSuccess, onFailure) {
        var cognitoUser = new AmazonCognitoIdentity.CognitoUser({
            Username: email,
            Pool: userPool
        });

        cognitoUser.confirmRegistration(code, true, function (err, result) {
            if (err) {
                onFailure(err);
            } else {
                onSuccess(result);
            }
        });
    }

    /* =====================
       Event handlers
    ====================== */

    $(function onDocReady() {
        $('#signinForm').submit(handleSignin);
        $('#registrationForm').submit(handleRegister);
        $('#verifyForm').submit(handleVerify);
    });

    function handleSignin(event) {
        event.preventDefault();

        var email = $('#emailInputSignin').val();
        var password = $('#passwordInputSignin').val();

        signin(
            email,
            password,
            function () {
                console.log('Successfully logged in');
                window.location.href = 'ride.html';
            },
            function (err) {
                alert(err.message || JSON.stringify(err));
            }
        );
    }

    function handleRegister(event) {
        event.preventDefault();

        var email = $('#emailInputRegister').val();
        var password = $('#passwordInputRegister').val();
        var password2 = $('#password2InputRegister').val();

        if (password !== password2) {
            alert('Passwords do not match');
            return;
        }

        register(
            email,
            password,
            function () {
                alert('Registration successful. Check your email for the verification code.');
                window.location.href = 'verify.html';
            },
            function (err) {
                alert(err.message || JSON.stringify(err));
            }
        );
    }

    function handleVerify(event) {
        event.preventDefault();

        var email = $('#emailInputVerify').val();
        var code = $('#codeInputVerify').val();

        verify(
            email,
            code,
            function () {
                alert('Verification successful. You can now sign in.');
                window.location.href = signinUrl;
            },
            function (err) {
                alert(err.message || JSON.stringify(err));
            }
        );
    }

}(jQuery));
