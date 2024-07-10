const path = require("path");

module.exports = {
    entry: { auth: "./public/scripts/auth.js" },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "public/scripts/bundle"),
    },
};
