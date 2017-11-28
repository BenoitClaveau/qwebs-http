/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const { UndefinedError } = require("oups");

class HttpRouteLoader {
    constructor($http, $fs, $config) {
        if (!$http) throw new UndefinedError("$http");
        if (!$fs) throw new UndefinedError("$fs");
        if (!$config) throw new UndefinedError("$config");
        this.http = $http;
        this.fs = $fs;
        this.config = $config;
    };
    
    async mount() {
        const file = await this.fs.load(this.config.services);
        if (!file || !file["http-routes"]) return;

        await Promise.all(file["http-routes"].map(route => {  //service define in services.json -> no need to import, create & mount it
            route.get && this.http.get(route.get, route.service, route.method, route.options);
            route.post && this.http.post(route.post, route.service, route.method, route.options);
            route.put && this.http.put(route.put, route.service, route.method, route.options);
            route.patch && this.http.patch(route.patch, route.service, route.method, route.options);
            route.delete && this.http.delete(route.delete, route.service, route.method, route.options);
        }))
    };
};

exports = module.exports = HttpRouteLoader;
