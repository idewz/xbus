var should = require('chai').should(),
    xbus = require('../src/index'),
    agencies = xbus.agencies();

describe('agencies', function() {
    it('get agencies list', function() {
        agencies.length.should.equal(0);
    });
});
