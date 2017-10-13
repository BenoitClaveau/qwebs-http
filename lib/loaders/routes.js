/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const fs = require("fs");
const path = require("path");
const DataError = require("./../dataerror");

class HttpRoutesLoader {
    constructor($http, $config) {
        if (!$qwebs) throw new DataError({ message: "$qwebs instance is not defined." });
        if (!$config) throw new DataError({ message: "$config is not defined." });
        this.$http = $http;
        this.$config = $config;
    };
    
    load() {
        return Promise.resolve().then(() => {
            let filepath = this.$config.qwebs;
            if (!filepath) return {};

            if (typeof filepath == "string") 
            {
                filepath = path.resolve(this.$qwebs.root, filepath);
                let str;
                try {
                    str = fs.readFileSync(filepath);
                } 
                catch(error) {
                    throw new DataError({ message: "Failed to read the qwebs service file.", data: { error: error.message, filepath: filepath }, stack: error.stack });
                }
                try {
                    return JSON.parse(str);
                }
                catch(error) {
                    throw new DataError({ message: "Failed to parse the qwebs service file.", data: { error: error.message, filepath: filepath }, stack: error.stack });
                }
            }
            else if (filepath instanceof Object) return filepath;
            else throw new DataError({ message: "Qwebs type is not managed." });
        }).then(content => { //load locators
            content["http-routes"] = content["http-routes"] || [];
            for(let locator of content["http-routes"]) {
                if (locator.get) this.$http.get(locator.get, locator.service, locator.method, locator.options);
                else if (locator.post) this.$http.post(locator.post, locator.service, locator.method, locator.options);
                else if (locator.put) this.$http.put(locator.put, locator.service, locator.method, locator.options);
                else if (locator.patch) this.$http.patch(locator.patch, locator.service, locator.method, locator.options);
                else if (locator.delete) this.$http.delete(locator.delete, locator.service, locator.method, locator.options);
                else throw new DataError({ message: "Unknown locator methode type.", data: locator });
            };
            return content;
        });
    };
};

exports = module.exports = HttpRoutesLoader;
