"use strict";

var should = require('chai').should(),
    nock = require('nock'),
    XBus = require('../lib/index'),
    agencyList = require('./data/agencyList.json'),
    predictions = require('./data/predictions.json'),
    routeList = require('./data/routeList.json'),
    routeListSmall = require('./data/routeList-small.json'),
    routeConfig = require('./data/routeConfig.json'),
    routeConfig28 = require('./data/routeConfig-28.json'),
    routeConfig29 = require('./data/routeConfig-29.json');

var xbus = new XBus();

describe('agencies', () => {
    beforeEach(() => {
        nock('http://webservices.nextbus.com')
            .get('/service/publicJSONFeed')
            .query({ command: 'agencyList' })
            .reply(200, agencyList);
    });

    it('get agencies list', async () => {
        const agencies = await xbus.getAgencies();
        agencies.length.should.equal(63);
    });

    it('get agency by tag id', async function () {
        const agency = await xbus.getAgency('sf-muni');
        agency.title.should.equal('San Francisco Muni');
    });
});

describe('route', () => {
    const id = 'sf-muni';
    const routeId = '28';

    beforeEach(() => {
        nock('http://webservices.nextbus.com')
            .get('/service/publicJSONFeed')
            .query({ command: 'routeList', a: id })
            .reply(200, routeList);
        nock('http://webservices.nextbus.com')
            .get('/service/publicJSONFeed')
            .query({ command: 'routeConfig', a: id, r: routeId })
            .reply(200, routeConfig);
    });

    it('get routes list', async () => {
        const routes = await xbus.getRoutes(id);
        routes.length.should.equal(83);
    });

    it('get route config', async () => {
        const route = await xbus.getRouteConfig(id, routeId);

        route.title.should.equal('28-19th Avenue');
        route.direction.length.should.equal(2);
        route.latMax.should.exist;
        route.latMin.should.exist;
        route.lonMax.should.exist;
        route.lonMin.should.exist;
    });
});

describe('predictions', () => {
    const command = 'predictions';
    const id = 'sf-muni';
    const stopId = 13356;

    beforeEach(() => {
        nock('http://webservices.nextbus.com')
            .get('/service/publicJSONFeed')
            .query({ command: command, a: id, stopId: stopId })
            .reply(200, predictions);
    });

    it('get predictions', async () => {
        const predictionList = await xbus.getPredictions(id, stopId);

        // TODO: not sure what we need now, but we get the data
    })
});

describe('nearby stops', () => {
    const id = 'sf-muni2';
    const location = { lat: 37.719777, lng: -122.470767 };

    beforeEach(() => {
        nock('http://webservices.nextbus.com')
            .get('/service/publicJSONFeed')
            .query({ command: 'routeList', a: id })
            .reply(200, routeListSmall);

        nock('http://webservices.nextbus.com')
            .get('/service/publicJSONFeed')
            .query({ command: 'routeConfig', a: id, r: 28 })
            .reply(200, routeConfig28);

        nock('http://webservices.nextbus.com')
            .get('/service/publicJSONFeed')
            .query({ command: 'routeConfig', a: id, r: 29 })
            .reply(200, routeConfig29);
    });

    it('return n nearest stop from the location', async () => {
        const stops = await xbus.getNearbyStops(location, 4);
        stops.length.should.equal(4);
        stops[0].name.should.equal("Garfield St & Beverly St");
        stops[0].id.should.equal("14245");
    });
});
