/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";
const { Error, HttpError } = require("oups");
const url = require("url");
const querystring = require("querystring");

class Router {
    constructor($qwebs, $IsItForMe) {
        this.qwebs = $qwebs;
        ["$isitget", "$isitpost", "$isitpost", "$isitdelete", "$isistput", "$isitpatch", "$isitasset"].map(async name => {
            await this.qwebs.inject(name, new $IsItForMe());
        });
        //this.qwebs.inject("$isoptions", new OptionsLeaf(this));
        //this.qwebs.inject("$Option", "./routes/get", { instanciate: false });
        //const OptionsLeaf = require("./router/options-leaf");

    };

    async mount() {
        ["$isitget", "$isitpost", "$isitpost", "$isitdelete", "$isistput", "$isitpatch", "$isitasset"].map(async name => {
            const service = await this.qwebs.resolve(name);
            service.routers.map(async e => await e.mount());
        });
    }

    async get(route) {
        const Get = await this.qwebs.resolve("$Get");
        const isitget = await this.qwebs.resolve("$isitget");
        const item = new Get(this.qwebs, route);
        isitget.push(item);
        return item;
    };

    async post(route) {
        const Post = await this.qwebs.resolve("$Post");
        const isitpost = await this.qwebs.resolve("$isitpost");
        const item = new Post(this.qwebs, route);
        isitpost.push(item);
        return item;
    };

    async delete(route) {
        const Delete = await this.qwebs.resolve("$Delete");
        const isitdelete = await this.qwebs.resolve("$isitdelete");
        const item = new Delete(this.qwebs, route);
        isitdelete.push(item);
        return item;
    };

    async put(route) {
        const Put = await this.qwebs.resolve("$Put");
        const isitput = await this.qwebs.resolve("isitput");
        const item = new Put(this.qwebs, route);
        isitput.push(item);
        return item;
    };

    async patch(route) {
        const Patch = await this.qwebs.resolve("$Patch");
        const isitpatch = await this.qwebs.resolve("isitpatch");
        const item = new Patch(this.qwebs, route);
        isitpatch.push(item);
        return item;
    };

    async asset(route) {
        const Asset = await this.qwebs.resolve("$Asset");
        const isitasset = await this.qwebs.resolve("isitasset");
        const item = new Asset(this.qwebs, route);
        isitasset.push(item);
        return item;
    };

    async leaf(method, pathname) {
        switch (method) {
            case "GET":
            case "HEAD":
                const isitasset = await this.qwebs.resolve("$isitasset");
                const isitget = await this.qwebs.resolve("$isitget");
                return isitasset.ask(pathname) || isitget.ask(pathname);
            case "POST":
                const isitpost = await this.qwebs.resolve("$isitpost");
                return isitpost.ask(pathname);
            case "DELETE":
                const isitdelete = await this.qwebs.resolve("$isitdelete");
                return isitdelete.ask(pathname);
            case "PUT":
                const isitput = await this.qwebs.resolve("$isitput");
                return isitput.ask(pathname);
            case "PATCH":
                const isitpatch = await this.qwebs.resolve("$isitpatch");
                return isitpatch.ask(pathname);
            //case "OPTIONS":
            default:
                throw new HttpError(405, { method, pathname });
        };
    };

    async invoke(request, response) {
        const Ask = await this.qwebs.resolve("$Ask");
        const Reply = await this.qwebs.resolve("$Reply");
        const config = await this.qwebs.resolve("$config");

        const part = url.parse(decodeURI(request.url));
        let leaf = await this.leaf(request.method, part.pathname);
        if (!leaf) throw new HttpError(404);

        const ask = new Ask(request, this.qwebs, config, { objectMode: true });
        const reply = new Reply(ask, response, leaf.router.options);
        try {
            reply.query = part.query ? querystring.parse(part.query) : {};
            reply.params = leaf.params;
            return await leaf.router.invoke(ask, reply);
        }
        catch(error) {
            reply.emit("error", error);
        }
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
