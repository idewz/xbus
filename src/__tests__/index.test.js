const nock = require('nock');
const XBus = require('../../lib/index');
const agencyList = require('./data/agencyList.json');
const predictions = require('./data/predictions.json');
const routeList = require('./data/routeList.json');
const routeListSmall = require('./data/routeList-small.json');
const routeConfig = require('./data/routeConfig.json');
const routeConfig28 = require('./data/routeConfig-28.json');
const routeConfig29 = require('./data/routeConfig-29.json');

const xbus = new XBus();

describe('agencies', () => {
  beforeEach(() => {
    nock('http://webservices.nextbus.com')
      .get('/service/publicJSONFeed')
      .query({ command: 'agencyList' })
      .reply(200, agencyList);
  });

  it('get agencies list', async () => {
    const agencies = await xbus.getAgencies();
    expect(agencies.length).toBe(63);
  });

  it('get agency by tag id', async () => {
    const agency = await xbus.getAgency('sf-muni');
    expect(agency.title).toBe('San Francisco Muni');
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
    expect(routes.length).toBe(83);
  });

  it('get route config', async () => {
    const route = await xbus.getRouteConfig(id, routeId);

    expect(route.title).toBe('28-19th Avenue');
    expect(route.direction.length).toBe(2);
    expect(route.latMax).not.toBeNull();
    expect(route.latMin).not.toBeNull();
    expect(route.lonMax).not.toBeNull();
    expect(route.lonMin).not.toBeNull();
  });
});

describe('predictions', () => {
  const command = 'predictions';
  const id = 'sf-muni';
  const stopId = 13356;

  beforeEach(() => {
    nock('http://webservices.nextbus.com')
      .get('/service/publicJSONFeed')
      .query({ command, a: id, stopId })
      .reply(200, predictions);
  });

  it('get predictions', async () => {
    const predictionList = await xbus.getPredictions(id, stopId);

    // TODO: not sure what we need now, but we get the data
  });
});

describe.skip('nearby stops', () => {
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
    expect(stops.length).toBe(4);
    expect(stops[0].name).toBe('Garfield St & Beverly St');
    expect(stops[0].id).toBe('14245');
  });
});
