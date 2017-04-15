"use strict"

const request = require('superagent');

module.exports = class XBus {
    base_url;

    constructor() {
        this.base_url = 'http://webservices.nextbus.com/service/publicJSONFeed';
    }

    async getAgencies() {
        const qs = { command: 'agencyList' };

        try {
            const res = await request.get(this.base_url).query(qs);
            return res.body.agency;
        }
        catch (err) {
            console.error(err);
            return [];
        }
    }

    async getAgency(tag) {
        const agencies = await this.getAgencies();

        return agencies.find(a => a.tag === tag);
    }
};

