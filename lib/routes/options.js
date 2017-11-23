/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";

const { Error } = require("oups");

class Options {
    constructor($router) {
        this.router = $router;
    };

    async invoke (ask, reply) {
        const { request } = ask;

        let allow = [];
        if (request.url == "*") allow = ["GET","POST","PUT", "PATCH","DELETE","HEAD","OPTIONS"];
        else {
            if (this.router.assetTree.findOne(request.pathname) || this.router.getTree.findOne(request.pathname)) allow.push("GET");
            if (this.router.postTree.findOne(request.pathname)) allow.push("POST");
            if (this.router.putTree.findOne(request.pathname)) allow.push("PUT");
            if (this.router.patchTree.findOne(request.pathname)) allow.push("PATCH");
            if (this.router.deleteTree.findOne(request.pathname)) allow.push("DELETE");
        }

        reply.headers["Allow"] = allow.join();
        reply.end();
    };
};

exports = module.exports = Options;