/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";
const { Error, HttpError } = require("oups");
const domain = require("domain");
const url = require("url");
const querystring = require('querystring');

class Router {
    constructor($qwebs, IsItForMe) {
        this.$qwebs = $qwebs;
        this.$qwebs.inject("$isitget", new IsItForMe());
        this.$qwebs.inject("$isitpost", new IsItForMe());
        this.$qwebs.inject("$isitdelete", new IsItForMe());
        this.$qwebs.inject("$isitput", new IsItForMe());
        this.$qwebs.inject("$isitpatch", new IsItForMe());
        this.$qwebs.inject("$isitasset", new IsItForMe());
        this.$qwebs.inject("$isoptions", new OptionsLeaf(this));

        this.$qwebs.inject("$Asset", "./routes/get", { instanciate: false });
        this.$qwebs.inject("$Post", "./routes/post", { instanciate: false });
        this.$qwebs.inject("$Asset", "./routes/delete", { instanciate: false });
        this.$qwebs.inject("$Put", "./routes/put", { instanciate: false });
        this.$qwebs.inject("$Patch", "./routes/patch", { instanciate: false });
        this.$qwebs.inject("$Asset", "./routes/asset", { instanciate: false });
        //this.$qwebs.inject("$Option", "./routes/get", { instanciate: false });
        //const OptionsLeaf = require("./router/options-leaf");

    };

    async get(route) {
        const Get = await this.$qwebs.resolve("$Get");
        const $isitget = await this.$qwebs.resolve("$isitget");
        const item = new Get(this.qwebs, route);
        isitget.push(item);
        return item;
    };

    async post(route) {
        const Post = await this.$qwebs.resolve("$Post");
        const $isitget = await this.$qwebs.resolve("$isitget");
        const item = new Post(this.qwebs, route);
        isitget.push(item);
        return item;
    };

    async delete(route) {
        const Delete = await this.$qwebs.resolve("$Delete");
        const $isitget = await this.$qwebs.resolve("$isitget");
        const item = new Delete(this.qwebs, route);
        isitget.push(item);
        return item;
    };

    async put(route) {
        const Put = await this.$qwebs.resolve("$Put");
        const $isitget = await this.$qwebs.resolve("$isitget");
        const item = new Put(this.qwebs, route);
        isitget.push(item);
        return item;
    };

    async patch(route) {
        const Patch = await this.$qwebs.resolve("$Patch");
        const $isitget = await this.$qwebs.resolve("$isitget");
        const item = new Patch(this.qwebs, route);
        isitget.push(item);
        return item;
    };

    async asset(route) {
        const Asset = await this.$qwebs.resolve("$Asset");
        const $isitget = await this.$qwebs.resolve("$isitget");
        const item = new Asset(this.qwebs, route);
        isitget.push(item);
        return item;
    };

    leaf(request) {
        switch (request.method) {
            case "GET":
            case "HEAD":
                return this.isitasset.ask(request.pathname) || this.isitget.ask(request.pathname);
            case "POST":
                return this.isitpost.ask(request.pathname);
            case "PUT":
                return this.isitput.ask(request.pathname);
            case "PATCH":
                return this.isitpatch.ask(request.pathname);
            case "DELETE":
                return this.isitdelete.ask(request.pathname);
            case "OPTIONS":
                return this.isoptions;
            default:
                throw new HttpError(500, "Method ${method} is unknown.", { method: request.method });
        };
    };

    async invoke(request, response) {
        const d = domain.create();
        d.add(request);
        d.add(response);
        d.on('error', error => {
            try {
                if (response.headersSent) {
                    response.addTrailers({ "error": "Error occurred, sorry." });
                    response.end();
                    
                }
                else {
                    response.writeHead(error.statusCode || 500);
                    response.end('Error occurred, sorry.');
                }
            } catch (error2) {
                console.error('Error sending 500', error2, request.url);
            }
        });
        d.run(async () => {
            //if (!this.$qwebs.loaded) throw new HttpError(503);
            const Reply = await this.$qwebs.resolve("Reply");
            
            const part = url.parse(decodeURI(request.url));
            request.pathname = part.pathname;
            let leaf = this.leaf(request);
            if (!leaf) throw new HttpError(404);
            request.query = part.query ? querystring.parse(part.query) : {};
            request.params = leaf.params;

            const reply = new Reply(request, response, this.$qwebs);
            await reply.mount();
            return leaf.router.invoke(reply);
        })

        // try {
            
        //     if (!leaf) throw new HttpError(404, { url: request.url });
            
        //     reply.params = leaf.params;
        //     if (!this.$qwebs.loaded) throw new HttpError(503, { url: request.url, header: {"Retry-After": 30 }});
        // }
        // catch (error) {
        //     reply.error = error;
        // }
        
    }

    toString() {
		return `GET
${this.isitget}
POST
${this.isitpost}
PUT
${this.isitput}
PATCH
${this.isitpatch}
DELETE
${this.isitdelete}`;
	}
};

exports = module.exports = Router;
