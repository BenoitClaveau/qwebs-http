/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");

describe("router", () => {
    
    it("single route", async done => {
        let qwebs = new Qwebs({ dirname: __dirname, config: {}});
        qwebs.inject("$http", "../../lib/qwebs-http");
        qwebs.inject("$info", "./services/info");
        const http = await qwebs.resolve("$http");
        http.get("/whoiam", "$info", "whoiam");
        http.get("/helloworld", "$info", "helloworld");
        await qwebs.load();
        const client = await qwebs.resolve("$client");
        const res = await client.get("/whoiam");
        expect(res).to.be("ok");
    });

    it("multiple route", async done => {
        let qwebs = new Qwebs({ dirname: __dirname, config: {}});
        qwebs.inject("$http", "../../lib/qwebs-http");
        qwebs.inject("$info", "./services/info");
        const http = await qwebs.resolve("$http");
        http.get("/whoiam", "$info", "whoiam");
        http.get("/helloworld", "$info", "helloworld");
        await qwebs.load();
        const client = await qwebs.resolve("$client");
        const res = await client.get("/whoiam");
        expect(res).to.be("ok");
        const res = await client.get("/helloworld");
        expect(res).to.be("ok");
    });

    it("default route", async done => {
        let qwebs = new Qwebs({ dirname: __dirname, config: {}});
        qwebs.inject("$http", "../../lib/qwebs-http");
        qwebs.inject("$info", "./services/info");
        const http = await qwebs.resolve("$http");
        http.get("/helloworld", "$info", "helloworld");
        http.get("/*", "$info", "whoiam");
        await qwebs.load();
        const client = await qwebs.resolve("$client");
        const res = await client.get("/whoiam");
        expect(res).to.be("ok");
        const res = await client.get("/test");
        expect(res).to.be("ok");
        const res = await client.get("/helloworld");
        expect(res).to.be("ok");
    });

    it("default route inverted", async done => {
        let qwebs = new Qwebs({ dirname: __dirname, config: {}});
        qwebs.inject("$http", "../../lib/qwebs-http");
        qwebs.inject("$info", "./services/info");
        const http = await qwebs.resolve("$http");
        http.get("/*", "$info", "whoiam");
        http.get("/helloworld", "$info", "helloworld");
        await qwebs.load();
        const client = await qwebs.resolve("$client");
        const res = await client.get("/whoiam");
        expect(res).to.be("ok");
        const res = await client.get("/test");
        expect(res).to.be("ok");
        const res = await client.get("/helloworld");
        expect(res).to.be("ok");
    });

    it("multiple token", async done => {
        let qwebs = new Qwebs({ dirname: __dirname, config: {}});
        qwebs.inject("$http", "../../lib/qwebs-http");
        qwebs.inject("$info", "./services/info");
        const http = await qwebs.resolve("$http");
        http.get("/*", "$info", "whoiam");
        http.get("/*/*", "$info", "helloworld");
        await qwebs.load();
        const client = await qwebs.resolve("$client");
        const res = await client.get("/whoiam");
        expect(res).to.be("ok");
        const res = await client.get("/test");
        expect(res).to.be("ok");
        const res = await client.get("/helloworld/3");
        expect(res).to.be("ok");
        const res = await client.get("/test/3");
        expect(res).to.be("ok");
    });

    it("multiple end route", async done => {
        let qwebs = new Qwebs({ dirname: __dirname, config: {}});
        qwebs.inject("$http", "../../lib/qwebs-http");
        qwebs.inject("$info", "./services/info");
        const http = await qwebs.resolve("$http");
        http.get("/whoiam", "$info", "whoiam");
        http.get("/whoiam", "$info", "helloworld");
        await qwebs.load();
    });
});