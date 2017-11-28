/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */


const { UndefinedError } = require("oups");
const Get = require("./get");
const path = require("path");
const Vinyl = require('vinyl');
const zlib = require("zlib");
const through2 = require("through2");

class Asset extends Get {
    constructor($qwebs, route) {
        super($qwebs, route);
    };

    async mount() {
        if (!this.filepath) throw new UndefinedError("filepath");
        const contentType = await this.qwebs.resolve("$content-type");
        let ext = path.extname(this.filepath);
        this.contentType = contentType.get(ext);
        this.file = new Vinyl({
            contents: fs.createReadStream('../node.tar').pipe(through2((chunk, encode, callback) => {
              this.push(chunk);
              callback();
            }))
        });

        // this.gzipFile = new Vinyl({
        //     contents: fs.createReadStream(this.filepath).pipe(zlib.createGzip())
        // });
        // this.deflateFile = new Vinyl({
        //     contents: fs.createReadStream(this.filepath).pipe(zlib.createDeflate())
        // });
    }

    async invoke (ask, reply) {
        reply.headers = { 
            ...reply.headers,
            "Content-Type": this.contentType,
            "Cache-Control": "no-cache"
        }
        this.file.clone().pipe(reply);
    }
};

exports = module.exports = Asset;
