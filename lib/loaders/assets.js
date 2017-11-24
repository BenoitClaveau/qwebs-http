/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const { UndefinedError } = require("oups");
const { walk } = require("qwebs");
const Asset = require("../routes/asset");

class AssetsLoader {
    constructor($router, $fs, $config) {
        if (!$router) throw new UndefinedError("$router");
        if (!$fs) throw new UndefinedError("$fs");
        if (!$config) throw new UndefinedError("$config");
        this.router = $router;
        this.fs = $fs;
        this.config = $config;
    };
    
    async mount() {
        if(!this.config.folder || this.config.folder == false) return;
        this.config.folder = path.resolve(this.qwebs.root, this.config.folder);
        try {
            const stat = await this.fs.stat(this.config.folder);
        }
        catch (error) {
            throw new Error("Failed to read public folder ${folder}.", { folder: this.config.folder }, error);
        }
        const files = walk.get(this.config.folder);
        for (filepath of files) {
            let route = filepath.substring(this.config.folder.length);
            let asset = this.router.asset(route);
            await asset.readFile(filepath);
        }
    };
};

exports = module.exports = AssetsLoader;




/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
 
"use strict";

const walk = require("./../utils/walk");
const Asset = require("./../routes/asset");
const fs = require("fs");
const path = require("path");
const { Error } = require("oups");

class AssetsLoader {
    constructor($qwebs, $config, $router) {
        if (!$qwebs) throw new Error("Qwebs instance is not defined.");
        if (!$config) throw new Error("Config is not defined.");
        if (!$router) throw new Error("Router is not defined.");
        this.qwebs = $qwebs; 
        this.config = $config;
        this.router = $router; 
    };
    
    async load() {
        if(!this.config.folder || this.config.folder == false) return [];
        this.config.folder = path.resolve(this.qwebs.root, this.config.folder);

        let stat;
        try {
            stat = await fs.statSync(this.config.folder);
        }
        catch (error) {
            throw new Error("Failed to read public folder.", error);
        }

        let promises = [];
        let files = walk.get(this.config.folder);
        for (filepath of files) {
            let route = filepath.substring(this.config.folder.length);
            let asset = this.router.asset(route);

            //promises.push(asset.initFromFile(filepath));
        };
        return Promise.all(promises);
    };
};

exports = module.exports = AssetsLoader;
