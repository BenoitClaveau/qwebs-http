/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";
const { Error, HttpError } = require("oups");
const domain = require("domain");
const Get = require("./routes/get");
const Post = require("./routes/post");
const Delete = require("./routes/delete");
const Put = require("./routes/put");
const Patch = require("./routes/patch");
const Options = require("./routes/options");
const Asset = require("./routes/asset");
const OptionsLeaf = require("./router/options-leaf");

class HttpRouter {
    constructor($qwebs, IsItForMe) {
        this.$qwebs = $qwebs;
        this.isitget = new IsItForMe();
        this.isitpost = new IsItForMe();
        this.isitdelete = new IsItForMe();
        this.isitput = new IsItForMe();
        this.isitpatch = new IsItForMe();
        this.isitasset = new IsItForMe();
        this.isoptions = new OptionsLeaf(this);
    };

    load() {
        this.isitget.load();
        this.isitpost.load();
        this.isitput.load();
        this.isitpatch.load();
        this.isitdelete.load();
    };

    get(route) {
        let item = new Get(this.$qwebs, route);
        this.isitget.push(item);
        return item;
    };

    post(route) {
        let item = new Post(this.$qwebs, route);
        this.isitpost.push(item);
        return item;
    };

    put(route) {
        let item = new Put(this.$qwebs, route);
        this.isitput.push(item);
        return item;
    };

    patch(route) {
        let item = new Patch(this.$qwebs, route);
        this.isitpatch.push(item);
        return item;
    };

    delete(route) {
        let item = new Delete(this.$qwebs, route);
        this.isitdelete.push(item);
        return item;
    };

    asset(route) {
        let item = new Asset(this.$qwebs, this.$qwebs.config, route);
        this.isitasset.push(item);
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
            const Reply = await this.$qwbes.resolve("Reply");
            let leaf = this.leaf(request);
            const reply = new Reply(request, response, leaf);
            await reply.mount();
            return leaf.httpRouter.invoke(reply);
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

exports = module.exports = HttpRouter;
