// node modules
const nunjucks = require('nunjucks')
const hjson = require('hjson')
const fs = require('fs')
const path = require('path')
const prettify = require('html-prettify')
const md = require('markdown-it')()
const moment = require('moment')
const Hashids = require('hashids/cjs')
const hashids = new Hashids()
const fm = require('front-matter')
const QRCode = require('qrcode')
const { createCanvas } = require('canvas')
// main module for generating static web pages
class generate {
    constructor(configPath, postsPath, linksPath, cryptoPath, errorsPath, templatesPath, viewsPath) {
        const sitePath = path.join(viewsPath, '_site')
        // checks site directory
        if (!fs.existsSync(sitePath)) {
            fs.mkdirSync(sitePath)
        }
        // read posts file
        const readConfig = fs.readFileSync(configPath, 'utf8')
        const readPosts = fs.readdirSync(postsPath, 'utf-8')
        const readLinks = fs.readFileSync(linksPath, 'utf8')
        const readCrypto = fs.readFileSync(cryptoPath, 'utf8')
        const readErrors = fs.readFileSync(errorsPath, 'utf8')
        // posts variables
        const config = hjson.parse(readConfig)
        const links = hjson.parse(readLinks)
        const crypto = hjson.parse(readCrypto)
        const errors = hjson.parse(readErrors)
        // sets and sorts posts
        var postPath = []
        readPosts.forEach(function (file) {
            if (path.extname(file) == '.md') {
                postPath.push(path.join(postsPath, file))
            }
        })
        var unsortedPosts = []
        postPath.forEach(function (post) {
            var readFile = fs.readFileSync(post, 'utf-8')
            unsortedPosts.push(fm(readFile))
        })
        var sortedPosts = unsortedPosts.sort(function (x, y) {
            return x.attributes.timestamp - y.attributes.timestamp
        })
        sortedPosts.reverse()
        // generates qrcodes for crypto
        var qrcode = []
        const canvas = createCanvas(500, 500)
        for (var j = 0; j < crypto.length; j++) {
            QRCode.toCanvas(canvas, crypto[j].address)
            qrcode[j] = canvas.toDataURL()
        }
        // configures nunjucks for the templates directory
        nunjucks.configure(templatesPath)
        // miscellaneous variables
        var id = []
        var posts = []
        // number of post per page
        const postPerPage = config.blog.postPerPage
        var pages = Math.min(sortedPosts.length / postPerPage)
        if (pages == 0) {
            pages = 1
        }
        // checks templates directory
        if (fs.existsSync(templatesPath)) {
            // index page generation
            this.index = function () {
                const indexTemplate = path.join(templatesPath, 'index.html')
                if (fs.existsSync(indexTemplate)) {
                    const pagePath = path.join(sitePath, 'page')
                    if (pages > 1) {
                        if (!fs.existsSync(pagePath)) {
                            fs.mkdirSync(pagePath)
                        }
                    }
                    for (var i = 0; i < pages; i++) {
                        var start = i * postPerPage
                        var end = postPerPage * (i + 1)
                        if (end > sortedPosts.length) {
                            end = sortedPosts.length
                        }
                        var k = 0
                        posts = []
                        for (var j = start; j < end; j++) {
                            posts[k] = sortedPosts[j]
                            id[k] = hashids.encode(sortedPosts[j].attributes.timestamp)
                            posts[k].body = md.render(sortedPosts[j].body)
                            posts[k].attributes.timestamp = moment.unix(sortedPosts[j].attributes.timestamp).format('LLLL')
                            k++
                        }
                        var pageCount = i + 1
                        if (pageCount == 1) {
                            var render = nunjucks.render('index.html', { config: config, posts: sortedPosts, postList: posts, id: id, links: links, crypto: crypto, qrcode: qrcode, currentPage: pageCount, totalPages: pages, path: './' })
                            fs.writeFileSync(path.join(sitePath, 'index.html'), prettify(render))
                        } else {
                            var render = nunjucks.render('index.html', { config: config, posts: sortedPosts, postList: posts, id: id, links: links, crypto: crypto, qrcode: qrcode, currentPage: pageCount, totalPages: pages, path: '../' })
                            fs.writeFileSync(path.join(pagePath, pageCount + '.html'), prettify(render))
                        }
                    }
                } else {
                    console.log('The index template doesn\'t exists.')
                }
            }
            // post page generation
            this.posts = function () {
                const postTemplate = path.join(templatesPath, 'post.html')
                if (fs.existsSync(postTemplate)) {
                    const postPath = path.join(sitePath, 'post')
                    if (sortedPosts.length > 0) {
                        if (!fs.existsSync(postPath)) {
                            fs.mkdirSync(postPath)
                        }
                    }
                    for (var i = 0; i < sortedPosts.length; i++) {
                        posts[i] = sortedPosts[i]
                        id[i] = hashids.encode(sortedPosts[i].attributes.timestamp)
                        posts[i].body = md.render(sortedPosts[i].body)
                        posts[i].attributes.timestamp = moment.unix(sortedPosts[i].attributes.timestamp).format('LLLL')
                        var render = nunjucks.render('post.html', { post: posts[i], posts: sortedPosts, config: config, links: links, crypto: crypto, qrcode: qrcode, id: id[i], path: '../' })
                        fs.writeFileSync(path.join(postPath, id[i] + '.html'), prettify(render))
                    }
                } else {
                    console.log('The post template doesn\'t exists.')
                }
            }
            // author page generation
            this.author = function () {
                if (config.site.about.length > 200) {
                    const authorTemplate = path.join(templatesPath, 'author.html')
                    if (fs.existsSync(authorTemplate)) {
                        for (var i = 0; i < sortedPosts.length; i++) {
                            id[i] = hashids.encode(sortedPosts[i].attributes.timestamp)
                        }
                        var render = nunjucks.render('author.html', { config: config, posts: sortedPosts, links: links, crypto: crypto, id: id, qrcode: qrcode, path: './' })
                        fs.writeFileSync(path.join(sitePath, 'author.html'), prettify(render))
                    } else {
                        console.log('The author template doesn\'t exists.')
                    }
                }
            }
            // link page generation
            this.links = function () {
                if (links.length > 5) {
                    const linksTemplate = path.join(templatesPath, 'links.html')
                    if (fs.existsSync(linksTemplate)) {
                        for (var i = 0; i < sortedPosts.length; i++) {
                            id[i] = hashids.encode(sortedPosts[i].attributes.timestamp)
                        }
                        var render = nunjucks.render('links.html', { config: config, posts: sortedPosts, links: links, crypto: crypto, id: id, qrcode: qrcode, path: './' })
                        fs.writeFileSync(path.join(sitePath, 'links.html'), prettify(render))
                    } else {
                        console.log('The links template doesn\'t exist.')
                    }
                }
            }
            // crypto page generation
            this.crypto = function () {
                if (crypto.length > 5) {
                    const cryptoTemplate = path.join(templatesPath, 'crypto.html')
                    if (fs.existsSync(cryptoTemplate)) {
                        for (var i = 0; i < sortedPosts.length; i++) {
                            id[i] = hashids.encode(sortedPosts[i].attributes.timestamp)
                        }
                        var render = nunjucks.render('crypto.html', { config: config, posts: sortedPosts, links: links, crypto: crypto, id: id, qrcode: qrcode, path: './' })
                        fs.writeFileSync(path.join(sitePath, 'crypto.html'), prettify(render))
                    } else {
                        console.log('The crypto template doesn\'t exist.')
                    }
                }
            }
            // error page generation
            this.errors = function () {
                const errorsTemplate = path.join(templatesPath, 'error.html')
                if (fs.existsSync(errorsTemplate)) {
                    const errorPath = path.join(sitePath, 'error')
                    if (!fs.existsSync(errorPath)) {
                        fs.mkdirSync(errorPath)
                    }
                    for (var i = 0; i < errors.length; i++) {
                        if (sortedPosts.length > 0) {
                            id[i] = hashids.encode(sortedPosts[i].attributes.timestamp)
                        }
                        var render = nunjucks.render('error.html', { config: config, posts: sortedPosts, links: links, crypto: crypto, error: errors[i], id: id, qrcode: qrcode, path: '../' })
                        fs.writeFileSync(path.join(errorPath, errors[i].status + '.html'), prettify(render))
                    }
                } else {
                    console.log('The error template doesn\'t exists.')
                }
            }
            // rss file generation
            this.rss = function () {
                if (config.rss.enabled) {
                    const rssTemplate = path.join(templatesPath, 'feed.rss');
                    if (fs.existsSync(rssTemplate)) {
                        for (var i = 0; i < sortedPosts.length; i++) {
                            posts[i] = sortedPosts[i]
                            id[i] = hashids.encode(sortedPosts[i].attributes.timestamp)
                            posts[i].body = md.render(sortedPosts[i].body)
                            posts[i].attributes.timestamp = moment.unix(sortedPosts[i].attributes.timestamp).format('LLLL')
                        }
                        var render = nunjucks.render('feed.rss', { config: config, posts: sortedPosts, id: id })
                        fs.writeFileSync(path.join(sitePath, 'feed.rss'), render)
                    } else {
                        console.log('The RSS template doesn\'t exists.')
                    }
                }
            }
        } else {
            console.log('The template directory doesn\'t exists.')
        }
    }
}
module.exports = generate