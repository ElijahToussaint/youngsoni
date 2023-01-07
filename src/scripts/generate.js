// importing the module created above
const path = require('path')
const generator = require('../modules/generator')
// read config files
const configPath = path.join(__dirname, '../config/config.hjson')
const postsPath = path.join(__dirname, '../data/posts/')
const linksPath = path.join(__dirname, '../data/links.hjson')
const cryptoPath = path.join(__dirname, '../data/crypto.hjson')
const errorsPath = path.join(__dirname, '../data/errors.hjson')
const templatesPath = path.join(__dirname, '../../templates')
const viewsPath = path.join(__dirname, '../../views')
// generate index
var generate = new generator(configPath, postsPath, linksPath, cryptoPath, errorsPath, templatesPath, viewsPath)
generate.index()
// generate posts
var generate = new generator(configPath, postsPath, linksPath, cryptoPath, errorsPath, templatesPath, viewsPath)
generate.posts()
// generate posts
var generate = new generator(configPath, postsPath, linksPath, cryptoPath, errorsPath, templatesPath, viewsPath)
generate.author()
// generate posts
var generate = new generator(configPath, postsPath, linksPath, cryptoPath, errorsPath, templatesPath, viewsPath)
generate.links()
// generate posts
var generate = new generator(configPath, postsPath, linksPath, cryptoPath, errorsPath, templatesPath, viewsPath)
generate.crypto()
// generate errors
var generate = new generator(configPath, postsPath, linksPath, cryptoPath, errorsPath, templatesPath, viewsPath)
generate.errors()
// generate rss
var generate = new generator(configPath, postsPath, linksPath, cryptoPath, errorsPath, templatesPath, viewsPath)
generate.rss()