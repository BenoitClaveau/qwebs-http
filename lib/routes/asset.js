/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */


const { UndefinedError, Error } = require("oups");
const Get = require("./get");
const Vinyl = require('vinyl');
const zlib = require("zlib");
const fs = require("fs");
const { ToBuffer } = require("qwebs");

class Asset extends Get {
    constructor($qwebs, route) {
        super($qwebs, route);
        this.file = null;
    };

    async init(filepath) {
        if (!filepath) throw new UndefinedError("filepath");

        const buffer = await fs.createReadStream(filepath).pipe(new ToBuffer());
        this.file = new Vinyl({
            path: filepath,
            contents: buffer
        });

        const contentType = await this.qwebs.resolve("$content-type");
        this.contentType = contentType.get(this.file.extname);
    }

    async invoke (ask, reply) {
        reply.headers = { 
            ...reply.headers,
            "Content-Type": this.contentType,
            "Cache-Control": "no-cache"
        }
        if (this.file.isBuffer()) reply.end(this.file.contents);
        else throw new Error("Asset content type of ${file.path} is not managed.", { file: this.file });
    }
};

exports = module.exports = Asset;
