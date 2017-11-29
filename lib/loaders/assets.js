/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const { UndefinedError, Error } = require("oups");
const { walk } = require("qwebs");
const path = require("path");
const Asset = require("../routes/asset");

class AssetsLoader {
    constructor($qwebs, $http, $fs, $config) {
        if (!$http) throw new UndefinedError("$http");
        if (!$fs) throw new UndefinedError("$fs");
        if (!$config) throw new UndefinedError("$config");
        this.qwebs = $qwebs;
        this.http = $http;
        this.fs = $fs;
        this.config = $config;
    };
    
    async mount() {
        if(!this.config.assets || /false/ig.test(this.config.assets)) return;

       const folder = path.resolve(this.qwebs.root, this.config.assets);
        try {
            const stat = await this.fs.stat(folder);
        }
        catch (error) {
            throw new Error("Failed to read public assets folder ${folder}.", { folder: folder }, error);
        }
        const files = walk.get(folder);
        await Promise.all(files.map(filepath => {
            let route = filepath.substring(folder.length);
            this.http.asset(route, filepath);
        }));
    };
};

exports = module.exports = AssetsLoader;