"use strict"

const request = require('superagent');

module.exports = class XBus {
    base_url;

    constructor() {
        this.base_url = 'http://webservices.nextbus.com/service/publicJSONFeed';
    }

    async fetch(qs) {
        try {
            const res = await request.get(this.base_url).query(qs);
            return res.body;
        }
        catch (err) {
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
};

