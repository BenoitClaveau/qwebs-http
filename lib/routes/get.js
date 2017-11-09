/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const { Error } = require("oups");

class Get {
    constructor($qwebs, route) {
        this.$qwebs = $qwebs;
        this.route = route;
        this.contentType = null;
        this.serviceName = null;
        this.methodName = null;
        this.method = null;
        this.options = {};
    };

    register(serviceName, methodName, options) {
        if (!serviceName) throw new Error("Service for ${route} is not defined.", { route: this.route });
        if (!methodName) throw new Error("Method for ${route} not defined.", { route: this.route });

        if (typeof serviceName == "string") this.serviceName = serviceName;
        else this.service = serviceName;

        if (typeof methodName == "string") this.methodName = methodName;
        else this.servimethodce = methodName;

        this.options = Object.assign(this.options, options);
        return this;
    };

    async mount() {
        if (this.serviceName) this.service = await this.$qwebs.resolve(this.serviceName);
        if (this.methodName) this.method = this.service[this.methodName];
        if (!this.method) throw new Error("Method for ${route} is not defined.", { service: this.serviceName, method: this.methodName, route: this.route });
    };

    async invoke (request, response) {
        return await this.method.call(this.service, request, response);
    };
};

exports = module.exports = Get;