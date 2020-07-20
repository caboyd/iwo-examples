const common = require ('./webpack.common')

const DevConfig = (env, argv) => {
    return {
        entry: common.entry,
        plugins: common.plugins,
        resolve: common.resolve,
        module: common.module,
        devtool: "source-map",
    };
};

module.exports = [DevConfig];
