/*!
 * qwebs
 * Copyright(c) 2017 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const Qwebs = require("qwebs");
const process =  require("process");
process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", reason);
});

describe("http-router", () => {
    
    it("read services.json", async done => {
        let qwebs = new Qwebs({ dirname: __dirname });
        await qwebs.load();
        const isitget = await qwebs.resolve("$isitget");
        expect(isitget.routers.length).to.be(1);
        expect(isitget.routers[0].methodName).to.be("getInfo");
        expect(isitget.routers[0].route).to.be("/info");
        expect(isitget.routers[0].serviceName).to.be("$info");
        await qwebs.unload();
    });
})