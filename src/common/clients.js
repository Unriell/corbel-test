'use strict';

var drivers = {};
var tokens = {};
var logins = {};

/**
 * Create a new driver with the clientName creadentials.
 * clientName credentials (corbelTest.CONFIG) are generated from .corbeltest config file or ENV variables
 * @param  {string}       clientName clientName configuration to log with
 * @return {corbelDriver} corbelDriver already autenticated
 */
function login(clientName) {
    if (!drivers[clientName]) {
        var driverConfig = corbelTest.getConfig(clientName);
        var savedConfig;
        try {
            savedConfig = JSON.parse(window.localStorage.getItem('driverconfig'));
        } catch (e) {
            console.warn('warn:parse:savedconfig');
            savedConfig = {};
        }

        // Generate a driver config between descriptor and user saved config
        driverConfig = _.extend(_.clone(driverConfig), savedConfig);
        drivers[clientName] = corbel.getDriver(driverConfig);
        var params = null;
        if (driverConfig.username && driverConfig.password) {
            params = {
                claims: {
                    'basic_auth.username': driverConfig.username,
                    'basic_auth.password': driverConfig.password,
                    'scope': driverConfig.scopes
                }
            };
        }
        logins[clientName] = drivers[clientName].iam.token().create(params);
    }
    return logins[clientName].then(function(response) {
        tokens[clientName] = response.data;
    });
}

/**
 * Login with all `*_CLIENT` + `*_USER` defined in `.corbeltest`
 * Production cases should be logged at every case due to secyurity reasons.
 * @return {Promise} A promise that resolves when all different clients/users are logged
 */
function loginAll() {
    var promises = [];

    if(corbelTest.localConfig.getEnvironment()!=='prod'){
        Object.keys(corbelTest.CONFIG).forEach(function(clientName) {
            if (clientName.indexOf('_CLIENT') !== -1 || clientName.indexOf('_USER') !== -1) {
                promises.push(login(clientName));
            }
        });
    }
    return Promise.all(promises);
}

function loginAsRandomUser(createDriver, loginDriver, creationExtraFields) {
    loginDriver = loginDriver || createDriver;
    var iamUtils = require('./iam');
    var user;
    return iamUtils.createUsers(createDriver, 1, creationExtraFields).then(function(users) {
        // default client scopes
        user = users[0];
        return loginUser(loginDriver, user.username, user.password);
    }).then(function(response) {
        return {
            token: response.data,
            user: user
        };
    });
}

var createValidEmailUserAndLogin = function (createDriver, loginDriver) {
    var userEmail;
    loginDriver = loginDriver || createDriver;

    return corbelTest.common.mail.mailInterface.getRandomMail()
        .then(function (email) {
            userEmail = email;
            return loginDriver.iam.token().create();
        })
        .then(function () {
            return createDriver.iam.token().create();
        })
        .then(function () {
            return loginAsRandomUser(createDriver, loginDriver, {email: userEmail});
        });
};

function loginUser(driver, username, password, deviceId) {
    var params = {
        claims: {
            'basic_auth.username': username,
            'basic_auth.password': password
        }
    };
    if (deviceId) {
      params.claims['device_id'] = deviceId;
    }

    return driver.iam.token().create(params);
}

module.exports = {
    login: login,
    loginAll: loginAll,
    loginAsRandomUser: loginAsRandomUser,
    createValidEmailUserAndLogin: createValidEmailUserAndLogin,
    loginUser: loginUser,
    drivers: drivers,
    logins: logins,
    tokens: tokens
};
