/*!
 * qwebs
 * Copyright(c) 2018 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

const { UndefinedError, Error, HttpError, NotImplementedError } = require("oups");
const Busboy = require('busboy');

class AskFactory {
    constructor($qwebs, $querystring) {
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!$querystring) throw new UndefinedError("$querystring");
        this.qwebs = $qwebs;
        this.querystring = $querystring;
    }

    async getContext(request) {
        if (!request) throw new UndefinedError("request");
        const qwebs = this.qwebs;
        const url = decodeURI(url);
        const method = request.method;
        const part = url.parse();
        const auth = part.auth;
        const hash = part.hash;
        const host = part.host;
        const hostname = part.hostname;
        const href = part.href;
        const path = part.path;
        const pathname = part.pathname;
        const port = part.port;
        const protocol = part.protocol;
        const search = part.search;
        const slashes = part.slashes;
        const querystring = part.query;
        const query = this.querystring.parse(querystring);
        return { qwebs, url, method, auth, hash, host, hostname, href, path, pathname, port, protocol, search, slashes, querystring, query };
    }

    async getHeaders(request) {
        if (!request) throw new UndefinedError("request");
        return request.headers;
    }

    async getAsk(request) {
        if (!request) throw new UndefinedError("request");
        const url = request.url;
        const method = request.method;
        const headers = request.headers;

        const Ask = await this.qwebs.resolve("$Ask");
        const context = { url, method };

        const mime = headers["content-type"].split(":").shift();
        
        if (/application\/json/.test(mime)) {
            const jsonStream = await this.qwebs.resolve("$json-stream");
            const parser = jsonStream.parse();
            const stream = request.pipe(parser);
            return new Ask(stream, headers, context, { objectMode: true });
        }
        if (/multipart\/form-data/.test(mime)) {
            const busboy = new Busboy({ headers });
            // busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
            //     this.emit("file", fieldname, file, filename, encoding, mimetype);
            // })
            // .on("field", (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
            //     this.emit("field", fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype);
            // })
            // .on("finish", () => {
            //     this.emit("finish");
            // })
            const stream = request.pipe(busboy);
            return new Ask(stream, headers, context);
        }
        return new Ask(request, headers, context);
    }

    async getReply(response) {
        if (!request) throw new UndefinedError("request");
        const url = request.url;
        const method = request.method;
        const headers = request.headers;

        const Ask = await this.qwebs.resolve("$Ask");
        const context = { url, method };

        const mime = headers["content-type"].split(":").shift();
        
        if (/application\/json/.test(mime)) {
            const jsonStream = await this.qwebs.resolve("$json-stream");
            const parser = jsonStream.parse();
            const stream = request.pipe(parser);
            return new Ask(stream, headers, context, { objectMode: true });
        }
        if (/multipart\/form-data/.test(mime)) {
            const busboy = new Busboy({ headers });
            // busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
            //     this.emit("file", fieldname, file, filename, encoding, mimetype);
            // })
            // .on("field", (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
            //     this.emit("field", fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype);
            // })
            // .on("finish", () => {
            //     this.emit("finish");
            // })
            const stream = request.pipe(busboy);
            return new Ask(stream, headers, context);
        }
        return new Ask(request, headers, context);
    }
}

module.exports = AskFactory;
