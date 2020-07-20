const HtmlWebpackExternalsPlugin = require("html-webpack-externals-plugin");
import common from './webpack.common'

const buildExamplesConfig = (env, argv) => {
    return {
        entry: common.entry,
        externals: common.externals,
        plugins: [
            ...common.plugins,
            //These needs to be after the HtmlWebpackPlugin's for the scripts to be added into templates
            ...Object.keys(common.examples).map(function(id) {
                return new HtmlWebpackExternalsPlugin({
                    files: [`examples/${id}.html`],
                    publicPath: "../",
                    externals: [
                        {
                            module: "gl-matrix",
                            entry: "gl-matrix.js",
                            global: "glMatrix",
                        },
                        {
                            module: "test",
                            entry: "dist/test.umd.js",
                            global: "test",
                        }
                    ],
                });
            })
        ],
        resolve: common.resolve,
        module: common.module,
        devtool: "source-map",
    };
};

module.exports = [buildExamplesConfig];
