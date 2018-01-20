'use strict';

const path = require('path'); // Cross platform path resolver
const htmlWebpackPlugin = require('html-webpack-plugin'); // Script tag injector
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin'); // Nicer CLI interface
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackMonitor = require('webpack-monitor');
const WebpackAutoInject = require('webpack-auto-inject-version');
const webpack = require('webpack');

/**
 * TODO: add version injection
 */

module.exports = function (env, options) {
  const isProduction = ((env && env.production) || process.env.NODE_ENV === 'production') || false;
  const hasStyleguide = (env && env.styleguide) || false;
  const host = 'localhost';
  const port = 8080;
  const hotReload = true;
  const assetsSubDirectory = 'static/';
  const isProfileBuild = (options && options.profile && options.json) || false;
  const globalVariables = {
    WP_STYLEGUIDE: JSON.stringify(hasStyleguide),
    WP_PRODUCTION: JSON.stringify(isProduction),
    'process.env': {
      NODE_ENV: JSON.stringify(isProduction ? 'production' : 'development') // Needed by vendor scripts
    },
  };
  const include = [
    path.resolve(__dirname, 'app'),
    path.resolve(__dirname, 'test'),
  ];

  if (!isProfileBuild && env && env.message) {
    const target = hasStyleguide
      ? 'Styleguide'
      : 'Production';

    // Print type of build (first value is log color)
    console.info('\x1b[36m%s\x1b[0m', '## Building for ' + target + ' ##');
  }

  function vueLoaderScss() {
    const use = [
      {
        loader: 'css-loader',
        options: {
          sourceMap: !isProduction,
        },
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: !isProduction,
        },
      },
      {
        loader: 'sass-resources-loader',
        options: {
          resources: path.resolve(__dirname, 'app/setup/_scss.scss'),
        },
      },
    ];

    if (!isProduction) {
      use.unshift('vue-style-loader');
    }

    return isProduction
      ? ExtractTextPlugin.extract({use})
      : use;
  }

  function webpackStats() {
    const stats = {
      all: false,
      // List created files
      assets: true,
      // Show errors
      errors: true,
      // Show build time
      timings: true,
      // Show warnings
      warnings: true,
    };

    return !isProfileBuild ? stats : undefined;
  }

  const baseConfig = {
    entry: {
      app: path.resolve(__dirname, 'app/main.js'),
    },
    resolve: {
      extensions: ['.js', '.vue', '.json'],
      alias: {
        vue$: 'vue/dist/vue.esm.js', // Use 'vue.esm' when importing from 'vue'
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          enforce: 'pre',
          include,
          options: {
            failOnError: isProduction,
            emitWarning: !isProduction, // Keeps overlay from showing during development, because it's annoying
          },
        },
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          include,
          options: {
            // extractCSS can not be used because of scss
            // cssSourceMap can not be used because of scss
            hotReload,
            // If you have problems debugging vue-files in devtools,
            // set this to false - it *may* help
            // https://vue-loader.vuejs.org/en/options.html#cachebusting
            cacheBusting: false,
            loaders: {
              scss: vueLoaderScss()
            }
          }
        },
        {
          test: /\.js$/,
          use: 'babel-loader',
          include,
        },
        {
          test: /\.(gif|png|jpe?g|svg)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: assetsSubDirectory + '/img/[name].[hash:7].[ext]',
              },
            },
            {
              loader: 'image-webpack-loader', // @see https://github.com/tcoopman/image-webpack-loader
              options: {
                svgo: {
                  removeEmptyContainers: true,
                },
              }
            },
          ],
        },
        {
          test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: assetsSubDirectory + 'media/[name].[hash:7].[ext]'
          }
        },
        {
          test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: assetsSubDirectory + 'fonts/[name].[hash:7].[ext]'
          }
        },
      ]
    },
    node: {
      // prevent webpack from injecting useless setImmediate polyfill because Vue
      // source contains it (although only uses it if it's native).
      setImmediate: false,
      // prevent webpack from injecting mocks to Node native modules
      // that does not make sense for the client
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty',
    },
  };

  const devConfig = {
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      publicPath: '/',
    },
    // Other methods may be faster. @see https://webpack.js.org/configuration/devtool/#src/components/Sidebar/Sidebar.jsx
    devtool: 'eval-source-map',
    devServer: {
      historyApiFallback: true, // Enables routing support
      host,
      port,
      hot: hotReload,
      compress: true,
      overlay: true,
      quiet: true, // Handled by FriendlyErrorsPlugin
      inline: true,
    },
    plugins: [
      new htmlWebpackPlugin({ // Script tag injection
        inject: true,
        template: 'index.html',
      }),
      new StyleLintPlugin({
        files: [
          '**/*.vue',
          '**/*.scss',
        ],
      }),
      new webpack.NamedModulesPlugin(), // Hot Module Replacement
      new webpack.HotModuleReplacementPlugin(), // Hot Module Replacement
      new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
          messages: [`Your application is running on http://${host}:${port}.`],
        },
      }),
      new webpack.DefinePlugin(globalVariables),
    ],
  };

  const prodConfig = {
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: `${assetsSubDirectory}js/[name].[hash].js`,
      chunkFilename: assetsSubDirectory + 'js/[id].[hash].js',
      publicPath: '/',
    },
    // @see https://webpack.js.org/configuration/devtool/#src/components/Sidebar/Sidebar.jsx
    devtool: hasStyleguide ? 'source-map' : false,
    // Customizes build log
    stats: webpackStats(),
    // Warn about performance issues
    performance: {
      hints: hasStyleguide ? false : 'warning',
      maxEntrypointSize: 500000, // 500kb
      maxAssetSize: 150000, // 150kb
    },
    plugins: [
      new UglifyJsPlugin({
        parallel: true,
        sourceMap: true,
      }),
      // Compress extracted CSS.
      new OptimizeCSSPlugin(),
      // extract css into its own file
      new ExtractTextPlugin({
        filename: assetsSubDirectory + 'css/[name].[contenthash].css',
        // Setting the following option to `false` will not extract CSS from codesplit chunks.
        // Their CSS will instead be inserted dynamically with style-loader when the codesplit chunk has been loaded by webpack.
        // It's currently set to `true` because we are seeing that sourcemaps are included in the codesplit bundle as well when it's `false`,
        // increasing file size: https://github.com/vuejs-templates/webpack/issues/1110
        allChunks: true,
      }),
      // split vendor js into its own file
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks(module) {
          // any required modules inside node_modules are extracted to vendor
          return (
            module.resource &&
            /\.js$/.test(module.resource) &&
            module.resource.indexOf(
              path.join(__dirname, 'node_modules')
            ) === 0
          );
        }
      }),
      // extract webpack runtime and module manifest to its own file in order to
      // prevent vendor hash from being updated whenever app bundle is updated
      new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest',
        minChunks: Infinity
      }),
      // Script tag injection
      new htmlWebpackPlugin({
        inject: true,
        template: 'index.html'
      }),
      new WebpackMonitor({
        capture: !hasStyleguide,
        target: '../stats/monitor.json',
        launch: env && env.monitor
      }),
      // copy custom static assets
      new CopyWebpackPlugin([
        {
          from: path.resolve(__dirname, 'static'),
          to: assetsSubDirectory,
          ignore: ['.*']
        },
        {
          from: path.resolve(__dirname, 'static/.htaccess'),
        },
      ]),
      new webpack.DefinePlugin(globalVariables),
      new WebpackAutoInject({
        SILENT: true,
        components: {
          AutoIncreaseVersion: false,
          InjectAsComment: true,
          InjectByTag: true
        },
        componentsOptions: {
          InjectAsComment: {
            tag: 'Build version: {version} - {date}',
            dateFormat: 'dddd, mmmm d, yyyy, hh:MM:ss'
          }
        }
      }),
    ],
  };

  return Object.assign(baseConfig, isProduction ? prodConfig : devConfig);
};
