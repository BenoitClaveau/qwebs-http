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
    constructor($qwebs, $IsItForMe) {
        this.$qwebs = $qwebs;
        this.$qwebs.inject("$isitget", new $IsItForMe());
        this.$qwebs.inject("$isitpost", new $IsItForMe());
        this.$qwebs.inject("$isitdelete", new $IsItForMe());
        this.$qwebs.inject("$isitput", new $IsItForMe());
        this.$qwebs.inject("$isitpatch", new $IsItForMe());
        this.$qwebs.inject("$isitasset", new $IsItForMe());
        //this.$qwebs.inject("$isoptions", new OptionsLeaf(this));
        //this.$qwebs.inject("$Option", "./routes/get", { instanciate: false });
        //const OptionsLeaf = require("./router/options-leaf");

    };

    async mount() {
        const isitget = await this.$qwebs.resolve("$isitget")
        await Promise.all(isitget.routers.map(e => e.mount()));
        const isitget = await this.$qwebs.resolve("$isitpost")
        await Promise.all(isitget.routers.map(e => e.mount()));
        const isitget = await this.$qwebs.resolve("$isitdelete")
        await Promise.all(isitget.routers.map(e => e.mount()));
        const isitget = await this.$qwebs.resolve("$isitput")
        await Promise.all(isitget.routers.map(e => e.mount()));
        const isitget = await this.$qwebs.resolve("$isitpatch")
        await Promise.all(isitget.routers.map(e => e.mount()));
        const isitget = await this.$qwebs.resolve("$isitasset")
        await Promise.all(isitget.routers.map(e => e.mount()));

    }

    async get(route) {
        const Get = await this.$qwebs.resolve("$Get");
        const isitget = await this.$qwebs.resolve("$isitget");
        const item = new Get(this.qwebs, route);
        isitget.push(item);
        return item;
    };

    async post(route) {
        const Post = await this.$qwebs.resolve("$Post");
        const isitpost = await this.$qwebs.resolve("$isitpost");
        const item = new Post(this.qwebs, route);
        isitget.push(item);
        return item;
    };

    async delete(route) {
        const Delete = await this.$qwebs.resolve("$Delete");
        const isitdelete = await this.$qwebs.resolve("$isitdelete");
        const item = new Delete(this.qwebs, route);
        isitdelete.push(item);
        return item;
    };

    async put(route) {
        const Put = await this.$qwebs.resolve("$Put");
        const isitput = await this.$qwebs.resolve("isitput");
        const item = new Put(this.qwebs, route);
        isitput.push(item);
        return item;
    };

    async patch(route) {
        const Patch = await this.$qwebs.resolve("$Patch");
        const isitpatch = await this.$qwebs.resolve("isitpatch");
        const item = new Patch(this.qwebs, route);
        isitpatch.push(item);
        return item;
    };

    async asset(route) {
        const Asset = await this.$qwebs.resolve("$Asset");
        const isitasset = await this.$qwebs.resolve("isitasset");
        const item = new Asset(this.qwebs, route);
        isitasset.push(item);
        return item;
    };

    async leaf(request) {
        switch (request.method) {
            case "GET":
            case "HEAD":
                const isitasset = await this.$qwebs.resolve("$isitasset");
                const isitget = await this.$qwebs.resolve("$isitget");
                return isitasset.ask(request.pathname) || isitget.ask(request.pathname);
            case "POST":
                const isitpost = await this.$qwebs.resolve("$isitpost");
                return isitpost.ask(request.pathname);
            case "DELETE":
                const isitdelete = await this.$qwebs.resolve("$isitdelete");
                return isitdelete.ask(request.pathname);
            case "PUT":
                const isitput = await this.$qwebs.resolve("$isitput");
                return isitput.ask(request.pathname);
            case "PATCH":
                const isitpatch = await this.$qwebs.resolve("$isitpatch");
                return isitpatch.ask(request.pathname);
            //case "OPTIONS":
            default:
                throw new HttpError(500, "Method ${method} is not implemented.", { method: request.method });
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
            const Reply = await this.$qwebs.resolve("$Reply");
            
            const part = url.parse(decodeURI(request.url));
            request.pathname = part.pathname;
            let leaf = await this.leaf(request);
            if (!leaf) throw new HttpError(404);
            request.query = part.query ? querystring.parse(part.query) : {};
            request.params = leaf.params;

            const reply = new Reply(request, response, this.$qwebs);
            await reply.mount();
            return await leaf.router.invoke(reply);
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
