"use strict";

var should = require('chai').should(),
    nock = require('nock'),
    XBus = require('../lib/index');

var xbus = new XBus();

describe('agencies', function () {
    beforeEach(function () {
        const agencyList = nock('http://webservices.nextbus.com')
            .get('/service/publicJSONFeed')
            .query({command: 'agencyList'})
            .reply(200, {
                    agency: [
                        {
                            "title": 'San Francisco Muni',
                            "regionTitle": "California-Northern",
                            "shortTitle": "SF Muni",
                            "tag": 'sf-muni'
                        },
                        {
                            "title": "AC Transit",
                            "regionTitle": "California-Northern",
                            "tag": "actransit"
                        }
                    ]
                },
                {'Content-Type': 'application/json'}
            );
    });

    it('get agencies list', async function () {
        const agencies = await xbus.getAgencies();
        agencies.length.should.equal(2);
    });

    it('get agency by tag id', async function () {
        const agency = await xbus.getAgency('sf-muni');
        agency.title.should.equal('San Francisco Muni');
    });
});
