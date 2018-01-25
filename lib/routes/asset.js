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
        this.options = {};
    };

    async init(filepath, options) {
        if (!filepath) throw new UndefinedError("filepath");
        this.options = { ...this.options, ...options };

        const buffer = await fs.createReadStream(filepath).pipe(new ToBuffer());
        this.file = new Vinyl({
            path: filepath,
            contents: buffer
        });

        const contentType = await this.qwebs.resolve("$content-type");
        try {
            this.contentType = contentType.get(this.file.extname);
        }
        catch(error) {
            throw new Error("Failed to determinate the content type of ${file.path}.", { file: this.file }, error)
        }
    }

    async invoke (context, ask, reply, headers) {
        const { file, contentType, options, qwebs } = context;

        if (options.auth) {
            const auth = await qwebs.resolve("$auth");
            await auth.authenticate(ask);
        }
        
        reply.headers = { 
            ...reply.headers,
            "Content-Type": contentType,
            "Cache-Control": "no-cache"
        }
        if (file.isBuffer()) reply.end(file.contents);
        else throw new Error("The content type of ${file.path} is not managed.", { file });
    }
};

exports = module.exports = Asset;
