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

    async invoke (context, stream, headers) {
        const { qwebs } = context;
        const { contentType, options, file } = this;

        if (options.auth) {
            const auth = await qwebs.resolve("$auth");
            await auth.authenticate(ask);
        }
        
        stream.respond({ 
            ...headers,
            "Content-Type": contentType,
            "Cache-Control": "no-cache"
        })
        stream.end(file.contents);
    }
};

exports = module.exports = Asset;
