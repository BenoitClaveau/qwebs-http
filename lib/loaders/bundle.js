/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const fs = require("fs");
const path = require("path");
const Asset = require("./../routes/asset");
const { Error } = require("oups");

class BundleLoader {
    constructor($qwebs, $config, $router) {
        if (!$qwebs) throw new Error("Qwebs instance is not defined.");
        if (!$config) throw new Error("Config is not defined.");
        if (!$router) throw new Error("Router is not defined.");
        this.qwebs = $qwebs;  
        this.config = $config;
        this.router = $router;
    };
    
    load() {
        return Promise.resolve().then(() => {
            let filepath = this.config.bundle;
            if(!filepath || filepath == false) return [];
            if (typeof filepath == "string") 
            {
                filepath = path.resolve(this.qwebs.root, filepath);
                let str;
                try {
                    str = fs.readFileSync(filepath);
                }
                catch(error) {
                    throw new Error("Failed to read the bundle file.", error);
                } 
                try {
                    return JSON.parse(str);
                }
                catch(error) {
                    throw new Error("Failed to parse the bundle file.", error);
                }
            }
            else if (filepath instanceof Object) return filepath;
            else throw new Error("Bundle type is not managed.");
        }).then(bundles => {
            let promises = [];
            for (let property in bundles) {
                let files = bundles[property];
                let asset = this.router.asset(property);
                promises.push(asset.initFromFiles(files));
            };
            return Promise.all(promises);  
        });
    };
};

exports = module.exports = BundleLoader;
