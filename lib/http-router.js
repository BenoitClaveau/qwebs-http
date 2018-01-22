/*!
 * qwebs
 * Copyright(c) 2015 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */

"use strict";
const { Error, HttpError, UndefinedError } = require("oups");
const url = require("url");
const querystring = require("querystring");

class HttpRouter {
    constructor($qwebs, $json, $querystring, $IsItForMe, $OptionsLeaf) {
        if (!$qwebs) throw new UndefinedError("$qwebs");
        if (!$json) throw new UndefinedError("$json");
        if (!$querystring) throw new UndefinedError("$querystring");
        if (!$IsItForMe) throw new UndefinedError("$IsItForMe");
        if (!$OptionsLeaf) throw new UndefinedError("$OptionsLeaf");
        this.qwebs = $qwebs;
        this.json = $json;
        this.querystring = $querystring;
        
        for (let name of ["$isitasset", "$isitget", "$isitpost", "$isitput", "$isitpatch", "$isitdelete"]) {
            const service = new $IsItForMe($json);
            this.qwebs.inject(name, service);
        };
        this.qwebs.inject("$isoptions", new $OptionsLeaf(this.qwebs));
    };

    async unmount() {
        for (let name of ["$isitasset", "$isitget", "$isitpost", "$isitput", "$isitpatch", "$isitdelete"]) {
            const isitforme = await this.qwebs.resolve(name);
            isitforme.clear();
        };
    }

    async get(route) {
        const { qwebs } = this;
        const Get = await qwebs.resolve("$Get");
        const isitget = await qwebs.resolve("$isitget");
        const item = new Get(qwebs, route);
        isitget.push(item);
        return item;
    };

    async post(route) {
        const { qwebs } = this;
        const Post = await qwebs.resolve("$Post");
        const isitpost = await qwebs.resolve("$isitpost");
        const item = new Post(qwebs, route);
        isitpost.push(item);
        return item;
    };

    async delete(route) {
        const { qwebs } = this;
        const Delete = await qwebs.resolve("$Delete");
        const isitdelete = await qwebs.resolve("$isitdelete");
        const item = new Delete(qwebs, route);
        isitdelete.push(item);
        return item;
    };

    async put(route) {
        const { qwebs } = this;
        const Put = await qwebs.resolve("$Put");
        const isitput = await qwebs.resolve("$isitput");
        const item = new Put(qwebs, route);
        isitput.push(item);
        return item;
    };

    async patch(route) {
        const { qwebs } = this;
        const Patch = await qwebs.resolve("$Patch");
        const isitpatch = await qwebs.resolve("$isitpatch");
        const item = new Patch(qwebs, route);
        isitpatch.push(item);
        return item;
    };

    async asset(route) {
        const { qwebs } = this;
        const Asset = await qwebs.resolve("$Asset");
        const isitasset = await qwebs.resolve("$isitasset");
        const item = new Asset(qwebs, route);
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
            case "OPTIONS":
                return await this.qwebs.resolve("$isoptions");

            default:
                throw new HttpError(405, { method, pathname });
        };
    };

    async invoke(ask, reply, overriddenUrl) {
        try {
            const { request } = ask;
            if (overriddenUrl) request.url = overriddenUrl;
            
            const part = url.parse(decodeURI(ask.url));
            ask.auth = part.auth;
            ask.hash = part.hash;
            ask.host = part.host;
            ask.hostname = part.hostname;
            ask.href = part.href;
            ask.path = part.path;
            ask.pathname = part.pathname;
            ask.port = part.port;
            ask.protocol = part.protocol;
            ask.search = part.search;
            ask.slashes = part.slashes;
            ask.querystring = part.query;
            if (part.query) ask.query = this.querystring.parse(part.query);
            
            let leaf = await this.leaf(request.method, ask.pathname);
            if (!leaf) 
                throw new HttpError(404);
            
            ask.params = leaf.params;
            ask.methodName = leaf.router.methodName;
            ask.serviceName = leaf.router.serviceName;
            ask.options = leaf.router.options;
            ask.route = leaf.router.route;

            await leaf.router.invoke(ask, reply);
        }
        catch(error) {
            error.url = ask.url;
            error.method = ask.method;
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

exports = module.exports = HttpRouter;
