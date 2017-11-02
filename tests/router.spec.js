/*!
 * qwebs
 * Copyright(c) 2016 Benoît Claveau <benoit.claveau@gmail.com>
 * MIT Licensed
 */
"use strict";

const expect = require("expect.js");
const Router = require("../lib/router");
const Injector = require("../lib/injector");

describe("router", () => {
    

    it("single route", async done => {
        let qwebs = new Qwebs({ dirname: __dirname, config: {}});
        qwebs.inject("$http", "../../lib/qwebs-http");
        qwebs.inject("$info", "./services/info");
        const http = await qwebs.resolve("$http");
        http.get("/info", "$info", "whoiam");
        await qwebs.load();
        const client = await qwebs.resolve("$client");
        const res = await client.get("/info");
        expect(res).to.be("ok");
    });
    
    // it("route *", done => {
    //     const mock = init();
    //     mock.injector.inject("$info", "./services/info.js");
        
    //     let item = mock.router.get("/*");
    //     item.register("$info", "whoiam");
    //     item.load(mock.injector.resolve("qwebs"));
        
    //     mock.request.url = "/info";
        
    //     return mock.router.invoke(mock.request, mock.response, "/info").then(res => {
    //         expect(res).toBe("I"m Info service.");
            
    //         return mock.router.invoke(mock.request, mock.response, "/test").then(res => {
    //             expect(res).toBe("I"m Info service.");
    //         });
    //     });    
    // });
    
    // it("multiple", done => {
    //     const mock = init();
    //     mock.injector.inject("$info", "./services/info.js");
        
    //     let item = mock.router.get("/info");
    //     item.register("$info", "whoiam");
    //     item.load(mock.injector.resolve("qwebs"));
        
    //     item = mock.router.get("/*");
    //     item.register("$info", "helloworld");
    //     item.load(mock.injector.resolve("qwebs"));
        
    //     mock.request.url = "/info";
        
    //     return mock.router.invoke(mock.request, mock.response, "/info").then(res => {
    //         expect(res).toBe("I"m Info service.");
    //     });
    // });
    
    // it("multiple invert declaration", done => {
    //     const mock = init();
    //     mock.injector.inject("$info", "./services/info.js");
        
    //     let item = mock.router.get("/*");
    //     item.register("$info", "helloworld");
    //     item.load(mock.injector.resolve("qwebs"));
        
    //     item = mock.router.get("/info");
    //     item.register("$info", "whoiam");
    //     item.load(mock.injector.resolve("qwebs"));
        
    //     mock.request.url = "/info";
        
    //     return mock.router.invoke(mock.request, mock.response, "/info").then(res => {
    //         expect(res).toBe("I"m Info service.");
    //     });
    // });
    
    // it("multiple redirection", done => {
    //     const mock = init();
    //     mock.injector.inject("$info", "./services/info.js");
        
    //     let item = mock.router.get("/*");
    //     item.register("$info", "helloworld");
    //     item.load(mock.injector.resolve("qwebs"));
        
    //     item = mock.router.get("/info");
    //     item.register("$info", "whoiam");
    //     item.load(mock.injector.resolve("qwebs"));
        
    //     mock.request.url = "/info";
        
    //     return mock.router.invoke(mock.request, mock.response, "/test").then(res => {
    //         expect(res).toBe("Hello world.");
    //     });
    // });
    
    // it("multiple token", done => {
    //     const mock = init();
    //     mock.injector.inject("$info", "./services/info.js");
        
    //     let item = mock.router.get("/*");
    //     item.register("$info", "helloworld");
    //     item.load(mock.injector.resolve("qwebs"));
        
    //     item = mock.router.get("/*/*");
    //     item.register("$info", "whoiam");
    //     item.load(mock.injector.resolve("qwebs"));
        
    //     mock.request.url = "/test/3";
        
    //     return mock.router.invoke(mock.request, mock.response).then(res => {
    //         expect(res).toBe("I"m Info service.");
    //     });
    // });
    
    // it("multiple end route", done => {
    //     const mock = init();
    //     mock.injector.inject("$info", "./services/info.js");
        
    //     let item = mock.router.get("/info");
    //     item.register("$info", "helloworld");

    //     item = mock.router.get("/info");
    //     item.register("$info", "whoiam");
    // });
});