'use strict';

const fs = require('fs');
const request = require('superagent');
const geolib = require('geolib');

module.exports = class XBus {
  constructor() {
    this.base_url = 'http://webservices.nextbus.com/service/publicJSONFeed';
  }

  async fetch(qs) {
    try {
      const res = await request.get(this.base_url).query(qs);
      return res.body;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async getAgencies() {
    const qs = { command: 'agencyList' };
    const res = await this.fetch(qs);

    return res.agency;
  }

  async getAgency(id) {
    const agencies = await this.getAgencies();

    return agencies.find(a => a.tag === id);
  }

  async getRoutes(id) {
    const qs = { command: 'routeList', a: id };
    const res = await this.fetch(qs);

    return res.route;
  }

  async getRouteConfig(id, routeId) {
    const qs = { command: 'routeConfig', a: id, r: routeId };
    const res = await this.fetch(qs);

    return res.route;
  }

  async getPredictions(id, stopId) {
    const qs = { command: 'predictions', a: id, stopId: stopId };
    const res = await this.fetch(qs);

    return res.predictions;
  }

  async getPredictions(id, stopId, routeTag) {
    const qs = { command: 'predictions', a: id, stopId: stopId, r: routeTag };
    const res = await this.fetch(qs);

    return res.predictions;
  }

  async findDirection(routeDirection, stopTag) {
    let direction = {};

    if (Array.isArray(routeDirection)) {
      const inboundRoute = routeDirection.find(d => d.name === 'Inbound');
      const outboundRoute = routeDirection.find(d => d.name === 'Outbound');

      if (inboundRoute.stop.find(s => s.tag === stopTag)) {
        direction.name = inboundRoute.name;
        direction.title = inboundRoute.title;
      } else {
        direction.name = outboundRoute.name;
        direction.title = outboundRoute.title;
      }
    } else {
      direction.name = routeDirection.name;
      direction.title = routeDirection.title;
    }

    return direction;
  }

  async getAllStops(agency) {
    const filepath = `./tmp/stops-${agency}.json`;
    let stops = [];
    let ids = [];

    // use cache if possible
    if (fs.existsSync(filepath)) {
      // console.log("we have cache for that");
      return JSON.parse(fs.readFileSync(filepath));
    }

    const routes = await this.getRoutes(agency);

    for (let r of routes) {
      const route = await this.getRouteConfig(agency, r.tag);

      for (let s of route.stop) {
        const id = s.stopId;

        if (ids.indexOf(id) === -1) {
          stops.push({
            id: id,
            tag: s.tag,
            name: s.title,
            lat: s.lat,
            lng: s.lon,
            dir: await this.findDirection(route.direction, s.tag),
          });
        }

        ids.push(id);
      }
    }

    // write to file for caching
    fs.writeFile(filepath, JSON.stringify(stops), err => {
      if (err) {
        console.error(err);
      } else {
        console.log(`file ${filepath} has been successfully written`);
      }
    });

    return stops;
  }

  async getNearbyAgencies(location) {
    return 'sf-muni';
  }

  async getNearbyStops(location, n) {
    const agency = await this.getNearbyAgencies(location);
    const stops = await this.getAllStops(agency);
    const nearestStops = [];
    const nearestStopIds = geolib.findNearest(location, stops, 0, n);

    nearestStopIds.forEach(n => {
      nearestStops.push(stops[n.key]);
    });

    return nearestStops;
  }

  async getNearbyPredictions(location, n) {
    let plist = {};
    const agency = await this.getNearbyAgencies(location);
    const stops = await this.getNearbyStops(location, n);

    // route / direction / stop / time
    for (let s of stops) {
      // console.log(`get predtiction for ${s.id}, ${s.tag}: ${s.name} (${s.dir.name})`);

      const p_at_stop = await this.getPredictions(agency, s.id);

      var addPrediction = p => {
        if (p.direction) {
          if (!plist.hasOwnProperty(p.routeTag)) {
            plist[p.routeTag] = {};
            plist[p.routeTag].inbound = [];
            plist[p.routeTag].outbound = [];
          }

          const direction = p.direction.title.startsWith('Inbound')
            ? 'inbound'
            : 'outbound';
          let time;

          if (Array.isArray(p.direction.prediction)) {
            time = p.direction.prediction[0].minutes;
          } else {
            time = p.direction.prediction.minutes;
          }

          const stop = {
            id: s.id,
            tag: p.stopTag,
            name: p.stopTitle,
            time: time,
          };

          plist[p.routeTag][direction].push(stop);
        }
      };

      if (Array.isArray(p_at_stop)) {
        p_at_stop.forEach(p => {
          addPrediction(p);
        });
      } else {
        addPrediction(p_at_stop);
      }
    }

    return plist;
  }
};
