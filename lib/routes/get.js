/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const { Error } = require("oups");

class Get {
    constructor($qwebs, route) {
        this.qwebs = $qwebs;
        this.route = route;
        this.contentType = null;
        this.serviceName = null;
        this.methodName = null;
        this.method = null;
        this.options = {};
    };

    async init(serviceName, methodName, options = {}) {
        this.options = { ...this.options, ...options };
        if (this.options.forward) return;

        if (!serviceName) throw new Error("Service for ${route} is not defined.", { route: this.route });
        if (!methodName) throw new Error("Method for ${route} not defined.", { route: this.route });

        if (typeof serviceName == "string") this.serviceName = serviceName;
        else this.service = serviceName;

        if (typeof methodName == "string") this.methodName = methodName;
        else this.methodName = methodName;

        if (this.serviceName) this.service = await this.qwebs.resolve(this.serviceName);
        if (this.methodName) this.method = this.service[this.methodName];
        if (!this.method) 
            throw new Error("${methodName} in ${serviceName} is not defined.", { serviceName: this.serviceName, methodName: this.methodName, route: this.route });
    };
    
    async invoke (context, ask, reply, headers) {
        const { method, service, options, qwebs } = context;
        if (options.auth) {
            const auth = await qwebs.resolve("$auth");
            await auth.authenticate(ask);
        }
        if (options.forward) return await reply.forward(options.forward); 
        return await method.call(service, context, ask, reply, headers);
    };
};

exports = module.exports = Get;