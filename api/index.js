const app = require("../app");
const connectDb = require("../config/db");
const env = require("../config/env");

let dbReadyPromise;

module.exports = async (req, res) => {
    dbReadyPromise ||= connectDb(env.dbUrl);
    await dbReadyPromise;
    return app(req, res);
};
