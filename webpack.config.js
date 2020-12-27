const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

const browserConfig = {
    entry: {
        microprediction: path.resolve(__dirname, "src/index.ts"),
    },
    devtool: "source-map",
    mode: "production",
    target: "web",
    module: {
        rules: [
            {
                test: /\.node$/,
                use: "node-loader",
            },
            {
                test: /.ts$/,
                loader: "ts-loader",
                exclude: /node_modules/,
                options: {
                    configFile: "tsconfig-webpack.json",
                    transpileOnly: true,
                },
            },
        ],
    },
    optimization: {
        removeAvailableModules: true,
        removeEmptyChunks: true,
        splitChunks: false,
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    output: {
                        comments: false,
                    },
                },
                extractComments: false,
            }),
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
        fallback: {
            querystring: require.resolve("querystring-es3"),
        }
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        library: "microprediction",
        libraryTarget: 'umd',
        umdNamedDefine: true,
        filename: "[name].js",
    },
};

module.exports = [browserConfig];