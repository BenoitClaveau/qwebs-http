/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const Get = require("./get");

class Asset extends Get {
    constructor($qwebs, route) {
        super($qwebs, route);
    };

    init(serviceName, methodName, options) {
    }

    async mount() {
    }

    async invoke (ask, reply) {
    }
};

exports = module.exports = Put;
