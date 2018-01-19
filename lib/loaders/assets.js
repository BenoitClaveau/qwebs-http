/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const { UndefinedError, Error } = require("oups");
const path = require("path");
const Asset = require("../routes/asset");

class AssetsLoader {
    constructor($qwebs, $http, $fs, $config, $walk) {
        if (!$http) throw new UndefinedError("$http");
        if (!$fs) throw new UndefinedError("$fs");
        if (!$config) throw new UndefinedError("$config");
        if (!$walk) throw new UndefinedError("$walk");
        this.qwebs = $qwebs;
        this.http = $http;
        this.fs = $fs;
        this.config = $config;
        this.walk = $walk;
    };
    
    //Do not use mount, need to be call manualy.
    async load() {
        const { config, fs, walk, http, qwebs } = this;
        if(!config.assets || /false/ig.test(config.assets)) return;
       const folder = path.resolve(qwebs.root, config.assets);
        try {
            const stat = await fs.stat(folder);
        }
        catch (error) {
            throw new Error("Failed to read public assets folder ${folder}.", { folder: folder }, error);
        }
        const files = walk.get(folder);
        for (let filepath of files) {
            let route = filepath.substring(folder.length);
            try {
                const options = { auth: false };
                await http.asset(route, filepath, options);
            }
            catch(error) {
                console.error(error);
            }
        }
    };
};

exports = module.exports = AssetsLoader;