"use strict";

var should = require('chai').should(),
    nock = require('nock'),
    XBus = require('../lib/index'),
    agencyList = require('./data/agencyList.json'),
    routeList = require('./data/routeList.json');

var xbus = new XBus();

describe('agencies', () => {
    beforeEach(() => {
        nock('http://webservices.nextbus.com')
            .get('/service/publicJSONFeed')
            .query({ command: 'agencyList' })
            .reply(200, agencyList);
    });

    it('get agencies list', async function () {
        const agencies = await xbus.getAgencies();
        agencies.length.should.equal(63);
    });

    it('get agency by tag id', async function () {
        const agency = await xbus.getAgency('sf-muni');
        agency.title.should.equal('San Francisco Muni');
    });
});

describe('route', () => {
    beforeEach(() => {
        nock('http://webservices.nextbus.com')
            .get('/service/publicJSONFeed')
            .query({ command: 'routeList', a: 'sf-muni' })
            .reply(200, routeList);
    });

    it('get route list', async function () {
        const routes = await xbus.getRoutes('sf-muni');
        routes.length.should.equal(83);
    })
});
