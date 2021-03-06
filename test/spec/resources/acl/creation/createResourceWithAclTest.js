describe('In RESOURCES module', function() {

    describe('In ACL module', function() {

        describe('while testing create resources', function() {
            var corbelDriver, corbelRootDriver;
            var DOMAIN = 'silkroad-qa';
            var COLLECTION_NAME = 'test:testAcl_' + Date.now();
            var user, resourceId, random;
            var aclConfigurationId;

            before(function(done) {
                corbelRootDriver = corbelTest.drivers['ADMIN_USER'].clone();
                corbelDriver = corbelTest.drivers['DEFAULT_USER'].clone();
                random = Date.now();

                corbelTest.common.iam.createUsers(corbelDriver, 1)
                .then(function(createdUser) {
                    user = createdUser[0];

                    return corbelTest.common.clients.loginUser(corbelDriver, user.username, user.password);
                })
                .then(function() {
                    return corbelTest.common.resources.setManagedCollection(
                        corbelRootDriver, DOMAIN, COLLECTION_NAME);
                })
                .then(function(id) {
                    aclConfigurationId = id;
                })
                .should.notify(done);
            });

            after(function(done) {
                return corbelTest.common.resources.unsetManagedCollection(
                    corbelRootDriver, DOMAIN, COLLECTION_NAME, aclConfigurationId)
                .then(function() {
                    return corbelDriver.resources.resource(COLLECTION_NAME, resourceId)
                        .delete();
                })
                .then(function() {
                    return corbelRootDriver.iam.user(user.id)
                    .delete();
                })
                .should.notify(done);
            });

            it('when a user adds a resource, this user has ADMIN rigths over the resource', function(done) {
                var TEST_OBJECT = {
                    test: 'test' + random,
                    test2: 'test2' + random
                };

                corbelDriver.resources.collection(COLLECTION_NAME)
                    .add(TEST_OBJECT)
                .then(function(id) {
                    resourceId = id;

                    return corbelDriver.resources.resource(COLLECTION_NAME, resourceId)
                        .get();
                })
                .then(function(response) {
                    expect(response).to.have.deep.property('data._acl.user:' + user.id + '.permission','ADMIN');
                })
                .should.notify(done);
            });
        });
    });
});
