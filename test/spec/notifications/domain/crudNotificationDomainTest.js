describe('In NOTIFICATIONS module', function() {

    describe('when testing crud operations for domain', function() {
        var corbelRootDriver;
        var testDriver;
        var notificationId;
        var notificationDomainData = {
            properties: {
                prop1: 'propValue1'
            },
            templates: {
                temp1: 'tempValue1'
            }
        };

        var domainIdCreated;

        before(function(done) {
            var clientScopes = ['notifications:admin'];
            var domainId = 'domain-crudDomainTest-' + Date.now();
            var domainIdCreated = 'silkroad-qa:' + domainId;
            var clientName = 'client-crudDomainTest-' + Date.now();
            corbelRootDriver = corbelTest.drivers['ROOT_CLIENT'].clone();

            corbelTest.common.iam.createDomainAndClient(corbelRootDriver, domainId, clientName, clientScopes)
            .then(function(clientInfo) {
                testDriver = corbelTest.getCustomDriver({
                    clientId: clientInfo.id,
                    clientSecret: clientInfo.key,
                    scopes: clientScopes.join(' '),
                    domain: domainIdCreated
                });
            })
            .should.notify(done);
        });

        it('a notification domain can be created, updated and deleted', function(done) {
            testDriver.notifications.domain().create(notificationDomainData)
            .then(function() {
                return testDriver.notifications.domain()
                    .get();
            })
            .then(function(response) {
                expect(response).to.have.deep.property('data.properties.prop1', 'propValue1');
                expect(response).to.have.deep.property('data.templates.temp1', 'tempValue1');

               return testDriver.notifications.domain()
                    .update({properties: {prop1: 'propValue1Updated'}});
            })
            .then(function() {
                return testDriver.notifications.domain()
                    .get();
            })
            .then(function(response) {
                expect(response).to.have.deep.property('data.properties.prop1', 'propValue1Updated');
                expect(response).to.have.deep.property('data.templates.temp1', 'tempValue1');

                return testDriver.notifications.domain()
                    .update({templates: {temp1: 'tempValue1Updated'}});

            })
            .then(function() {
                return testDriver.notifications.domain()
                    .get();
            })
            .then(function(response) {
                expect(response).to.have.deep.property('data.properties.prop1', 'propValue1Updated');
                expect(response).to.have.deep.property('data.templates.temp1', 'tempValue1Updated');

                return testDriver.notifications.domain()
                    .delete();
            })
            .then(function() {
                return testDriver.notifications.domain()
                    .get()
                    .should.be.rejected;
            })
            .then(function(e) {
                expect(e).to.have.property('status', 404);
                expect(e).to.have.deep.property('data.error', 'not_found');
            })
            .should.notify(done);
        });
    });
});
