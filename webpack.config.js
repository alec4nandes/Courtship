const path = require("path");

module.exports = {
    entry: "./public/scripts/sign-in.js",
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "public/scripts"),
    },
};
