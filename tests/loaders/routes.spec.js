"use strict";

const expect = require("expect.js");
const Qwebs = require("qwebs");
const process =  require("process");

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at:", p, "reason:", reason);
});

describe("router-http", () => {
    
    it("single route", async done => {
        let qwebs = new Qwebs({ dirname: __dirname });
        await qwebs.load();
        const router = await qwebs.resolve("$router-http");
    });
})