[
  /* config.module.rule('vue') */
  {
    test: /\.vue$/,
    use: [
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/cache-loader/dist/cjs.js',
        options: {
          cacheDirectory: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/.cache/vue-loader',
          cacheIdentifier: '2e8dee20'
        }
      },
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-loader/lib/index.js',
        options: {
          compilerOptions: {
            whitespace: 'condense'
          },
          cacheDirectory: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/.cache/vue-loader',
          cacheIdentifier: '2e8dee20',
          transformAssetUrls: {
            'v-app-bar': 'src',
            'v-carousel-item': [
              'src',
              'lazy-src'
            ],
            'v-img': [
              'src',
              'lazy-src'
            ],
            'v-navigation-drawer': 'src',
            'v-parallax': 'src',
            'v-toolbar': 'src'
          }
        }
      }
    ]
  },
  /* config.module.rule('images') */
  {
    test: /\.(png|jpe?g|gif|webp)(\?.*)?$/,
    use: [
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/url-loader/dist/cjs.js',
        options: {
          limit: 4096,
          fallback: {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/file-loader/dist/cjs.js',
            options: {
              name: 'img/[name].[hash:8].[ext]'
            }
          }
        }
      }
    ]
  },
  /* config.module.rule('svg') */
  {
    test: /\.(svg)(\?.*)?$/,
    use: [
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/file-loader/dist/cjs.js',
        options: {
          name: 'img/[name].[hash:8].[ext]'
        }
      }
    ]
  },
  /* config.module.rule('media') */
  {
    test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
    use: [
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/url-loader/dist/cjs.js',
        options: {
          limit: 4096,
          fallback: {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/file-loader/dist/cjs.js',
            options: {
              name: 'media/[name].[hash:8].[ext]'
            }
          }
        }
      }
    ]
  },
  /* config.module.rule('fonts') */
  {
    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
    use: [
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/url-loader/dist/cjs.js',
        options: {
          limit: 4096,
          fallback: {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/file-loader/dist/cjs.js',
            options: {
              name: 'fonts/[name].[hash:8].[ext]'
            }
          }
        }
      }
    ]
  },
  /* config.module.rule('pug') */
  {
    test: /\.pug$/,
    oneOf: [
      /* config.module.rule('pug').rule('pug-vue') */
      {
        resourceQuery: /vue/,
        use: [
          {
            loader: 'pug-plain-loader'
          }
        ]
      },
      /* config.module.rule('pug').rule('pug-template') */
      {
        use: [
          {
            loader: 'raw-loader'
          },
          {
            loader: 'pug-plain-loader'
          }
        ]
      }
    ]
  },
  /* config.module.rule('css') */
  {
    test: /\.css$/,
    oneOf: [
      /* config.module.rule('css').rule('vue-modules') */
      {
        resourceQuery: /module/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2,
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          }
        ]
      },
      /* config.module.rule('css').rule('vue') */
      {
        resourceQuery: /\?vue/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          }
        ]
      },
      /* config.module.rule('css').rule('normal-modules') */
      {
        test: /\.module\.\w+$/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2,
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          }
        ]
      },
      /* config.module.rule('css').rule('normal') */
      {
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          }
        ]
      }
    ]
  },
  /* config.module.rule('postcss') */
  {
    test: /\.p(ost)?css$/,
    oneOf: [
      /* config.module.rule('postcss').rule('vue-modules') */
      {
        resourceQuery: /module/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2,
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          }
        ]
      },
      /* config.module.rule('postcss').rule('vue') */
      {
        resourceQuery: /\?vue/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          }
        ]
      },
      /* config.module.rule('postcss').rule('normal-modules') */
      {
        test: /\.module\.\w+$/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2,
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          }
        ]
      },
      /* config.module.rule('postcss').rule('normal') */
      {
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          }
        ]
      }
    ]
  },
  /* config.module.rule('scss') */
  {
    test: /\.scss$/,
    oneOf: [
      /* config.module.rule('scss').rule('vue-modules') */
      {
        resourceQuery: /module/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2,
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/sass-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              implementation: {
                render: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                renderSync: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                info: 'dart-sass\t1.32.0\t(Sass Compiler)\t[Dart]\ndart2js\t2.10.4\t(Dart Compiler)\t[Dart]',
                types: {
                  Boolean: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Color: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  List: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Map: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Null: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Number: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  String: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Error: function Error() { [native code] }
                },
                NULL: {
                  toString: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  }
                },
                TRUE: {
                  value: true
                },
                FALSE: {
                  value: false
                },
                cli_pkg_main_0_: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                }
              },
              additionalData: '@import \'@/scss/variables.scss\';\n@import \'~vuetify/src/styles/styles.sass\';'
            }
          }
        ]
      },
      /* config.module.rule('scss').rule('vue') */
      {
        resourceQuery: /\?vue/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/sass-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              implementation: {
                render: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                renderSync: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                info: 'dart-sass\t1.32.0\t(Sass Compiler)\t[Dart]\ndart2js\t2.10.4\t(Dart Compiler)\t[Dart]',
                types: {
                  Boolean: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Color: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  List: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Map: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Null: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Number: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  String: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Error: function Error() { [native code] }
                },
                NULL: {
                  toString: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  }
                },
                TRUE: {
                  value: true
                },
                FALSE: {
                  value: false
                },
                cli_pkg_main_0_: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                }
              },
              additionalData: '@import \'@/scss/variables.scss\';\n@import \'~vuetify/src/styles/styles.sass\';'
            }
          }
        ]
      },
      /* config.module.rule('scss').rule('normal-modules') */
      {
        test: /\.module\.\w+$/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2,
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/sass-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              implementation: {
                render: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                renderSync: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                info: 'dart-sass\t1.32.0\t(Sass Compiler)\t[Dart]\ndart2js\t2.10.4\t(Dart Compiler)\t[Dart]',
                types: {
                  Boolean: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Color: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  List: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Map: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Null: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Number: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  String: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Error: function Error() { [native code] }
                },
                NULL: {
                  toString: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  }
                },
                TRUE: {
                  value: true
                },
                FALSE: {
                  value: false
                },
                cli_pkg_main_0_: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                }
              },
              additionalData: '@import \'@/scss/variables.scss\';\n@import \'~vuetify/src/styles/styles.sass\';'
            }
          }
        ]
      },
      /* config.module.rule('scss').rule('normal') */
      {
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/sass-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              implementation: {
                render: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                renderSync: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                info: 'dart-sass\t1.32.0\t(Sass Compiler)\t[Dart]\ndart2js\t2.10.4\t(Dart Compiler)\t[Dart]',
                types: {
                  Boolean: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Color: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  List: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Map: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Null: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Number: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  String: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Error: function Error() { [native code] }
                },
                NULL: {
                  toString: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  }
                },
                TRUE: {
                  value: true
                },
                FALSE: {
                  value: false
                },
                cli_pkg_main_0_: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                }
              },
              additionalData: '@import \'@/scss/variables.scss\';\n@import \'~vuetify/src/styles/styles.sass\';'
            }
          }
        ]
      }
    ]
  },
  /* config.module.rule('sass') */
  {
    test: /\.sass$/,
    oneOf: [
      /* config.module.rule('sass').rule('vue-modules') */
      {
        resourceQuery: /module/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2,
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/sass-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              implementation: {
                render: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                renderSync: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                info: 'dart-sass\t1.32.0\t(Sass Compiler)\t[Dart]\ndart2js\t2.10.4\t(Dart Compiler)\t[Dart]',
                types: {
                  Boolean: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Color: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  List: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Map: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Null: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Number: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  String: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Error: function Error() { [native code] }
                },
                NULL: {
                  toString: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  }
                },
                TRUE: {
                  value: true
                },
                FALSE: {
                  value: false
                },
                cli_pkg_main_0_: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                }
              },
              sassOptions: {
                indentedSyntax: true
              },
              additionalData: '@import \'@/scss/variables.scss\'\n@import \'~vuetify/src/styles/styles.sass\''
            }
          }
        ]
      },
      /* config.module.rule('sass').rule('vue') */
      {
        resourceQuery: /\?vue/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/sass-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              implementation: {
                render: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                renderSync: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                info: 'dart-sass\t1.32.0\t(Sass Compiler)\t[Dart]\ndart2js\t2.10.4\t(Dart Compiler)\t[Dart]',
                types: {
                  Boolean: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Color: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  List: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Map: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Null: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Number: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  String: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Error: function Error() { [native code] }
                },
                NULL: {
                  toString: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  }
                },
                TRUE: {
                  value: true
                },
                FALSE: {
                  value: false
                },
                cli_pkg_main_0_: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                }
              },
              sassOptions: {
                indentedSyntax: true
              },
              additionalData: '@import \'@/scss/variables.scss\'\n@import \'~vuetify/src/styles/styles.sass\''
            }
          }
        ]
      },
      /* config.module.rule('sass').rule('normal-modules') */
      {
        test: /\.module\.\w+$/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2,
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/sass-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              implementation: {
                render: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                renderSync: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                info: 'dart-sass\t1.32.0\t(Sass Compiler)\t[Dart]\ndart2js\t2.10.4\t(Dart Compiler)\t[Dart]',
                types: {
                  Boolean: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Color: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  List: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Map: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Null: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Number: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  String: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Error: function Error() { [native code] }
                },
                NULL: {
                  toString: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  }
                },
                TRUE: {
                  value: true
                },
                FALSE: {
                  value: false
                },
                cli_pkg_main_0_: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                }
              },
              sassOptions: {
                indentedSyntax: true
              },
              additionalData: '@import \'@/scss/variables.scss\'\n@import \'~vuetify/src/styles/styles.sass\''
            }
          }
        ]
      },
      /* config.module.rule('sass').rule('normal') */
      {
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/sass-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              implementation: {
                render: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                renderSync: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                },
                info: 'dart-sass\t1.32.0\t(Sass Compiler)\t[Dart]\ndart2js\t2.10.4\t(Dart Compiler)\t[Dart]',
                types: {
                  Boolean: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Color: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  List: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Map: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Null: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  },
                  Number: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  String: function () {
                    return _call(f, this, Array.prototype.slice.apply(arguments));
                  },
                  Error: function Error() { [native code] }
                },
                NULL: {
                  toString: function () {
                    return _call(f, Array.prototype.slice.apply(arguments));
                  }
                },
                TRUE: {
                  value: true
                },
                FALSE: {
                  value: false
                },
                cli_pkg_main_0_: function () {
                  return _call(f, Array.prototype.slice.apply(arguments));
                }
              },
              sassOptions: {
                indentedSyntax: true
              },
              additionalData: '@import \'@/scss/variables.scss\'\n@import \'~vuetify/src/styles/styles.sass\''
            }
          }
        ]
      }
    ]
  },
  /* config.module.rule('less') */
  {
    test: /\.less$/,
    oneOf: [
      /* config.module.rule('less').rule('vue-modules') */
      {
        resourceQuery: /module/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2,
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: 'less-loader',
            options: {
              sourceMap: false
            }
          }
        ]
      },
      /* config.module.rule('less').rule('vue') */
      {
        resourceQuery: /\?vue/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: 'less-loader',
            options: {
              sourceMap: false
            }
          }
        ]
      },
      /* config.module.rule('less').rule('normal-modules') */
      {
        test: /\.module\.\w+$/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2,
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: 'less-loader',
            options: {
              sourceMap: false
            }
          }
        ]
      },
      /* config.module.rule('less').rule('normal') */
      {
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: 'less-loader',
            options: {
              sourceMap: false
            }
          }
        ]
      }
    ]
  },
  /* config.module.rule('stylus') */
  {
    test: /\.styl(us)?$/,
    oneOf: [
      /* config.module.rule('stylus').rule('vue-modules') */
      {
        resourceQuery: /module/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2,
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: 'stylus-loader',
            options: {
              sourceMap: false,
              preferPathResolver: 'webpack'
            }
          }
        ]
      },
      /* config.module.rule('stylus').rule('vue') */
      {
        resourceQuery: /\?vue/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: 'stylus-loader',
            options: {
              sourceMap: false,
              preferPathResolver: 'webpack'
            }
          }
        ]
      },
      /* config.module.rule('stylus').rule('normal-modules') */
      {
        test: /\.module\.\w+$/,
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2,
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              }
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: 'stylus-loader',
            options: {
              sourceMap: false,
              preferPathResolver: 'webpack'
            }
          }
        ]
      },
      /* config.module.rule('stylus').rule('normal') */
      {
        use: [
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/vue-style-loader/index.js',
            options: {
              sourceMap: false,
              shadowMode: false
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/css-loader/dist/cjs.js',
            options: {
              sourceMap: false,
              importLoaders: 2
            }
          },
          {
            loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/postcss-loader/src/index.js',
            options: {
              sourceMap: false,
              plugins: [
                function () { /* omitted long function */ }
              ]
            }
          },
          {
            loader: 'stylus-loader',
            options: {
              sourceMap: false,
              preferPathResolver: 'webpack'
            }
          }
        ]
      }
    ]
  },
  /* config.module.rule('js') */
  {
    test: /\.m?jsx?$/,
    exclude: [
      function () { /* omitted long function */ }
    ],
    use: [
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/cache-loader/dist/cjs.js',
        options: {
          cacheDirectory: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/.cache/babel-loader',
          cacheIdentifier: '686a0c3c'
        }
      },
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/babel-loader/lib/index.js'
      }
    ]
  },
  /* config.module.rule('eslint') */
  {
    enforce: 'pre',
    test: /\.(vue|(j|t)sx?)$/,
    exclude: [
      /node_modules/,
      '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/@vue/cli-service/lib'
    ],
    use: [
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/eslint-loader/index.js',
        options: {
          extensions: [
            '.js',
            '.jsx',
            '.vue',
            '.ts',
            '.tsx'
          ],
          cache: true,
          cacheIdentifier: '38fdbf3c',
          emitWarning: false,
          emitError: false,
          eslintPath: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/eslint',
          formatter: undefined
        }
      }
    ]
  },
  /* config.module.rule('ts') */
  {
    test: /\.ts$/,
    use: [
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/cache-loader/dist/cjs.js',
        options: {
          cacheDirectory: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/.cache/ts-loader',
          cacheIdentifier: '2014348c'
        }
      },
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/babel-loader/lib/index.js'
      },
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/ts-loader/index.js',
        options: {
          transpileOnly: true,
          appendTsSuffixTo: [
            '\\.vue$'
          ],
          happyPackMode: false
        }
      }
    ]
  },
  /* config.module.rule('tsx') */
  {
    test: /\.tsx$/,
    use: [
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/cache-loader/dist/cjs.js',
        options: {
          cacheDirectory: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/.cache/ts-loader',
          cacheIdentifier: '2014348c'
        }
      },
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/babel-loader/lib/index.js'
      },
      {
        loader: '/Users/craig/Development/Personal/Fluidd/fluidd/node_modules/ts-loader/index.js',
        options: {
          transpileOnly: true,
          happyPackMode: false,
          appendTsxSuffixTo: [
            '\\.vue$'
          ]
        }
      }
    ]
  },
  /* config.module.rule('i18n-loader') */
  {
    test: /.\.yaml$/,
    use: [
      {
        loader: 'json-loader'
      },
      {
        loader: 'yaml-loader'
      }
    ]
  },
  /* config.module.rule('wasm-loader') */
  {
    test: /.\.wasm$/,
    use: [
      {
        loader: 'file-loader'
      }
    ]
  }
]
