// node packages
const fs = require('fs')
const path = require('path')
const express = require('express')
const nunjucks = require('nunjucks')
const hjson = require('hjson')
const Hashids = require('hashids/cjs')
const hashids = new Hashids()
const fm = require('front-matter')
const bodyParser = require('body-parser')
const { check, validationResult } = require('express-validator')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const cors = require('cors')
const multer = require('multer')
const upload = multer({ dest: 'public/assets/' })
const cryptoIcon = require(path.join(__dirname, 'src/modules/getCryptoIcon'))
const blockExplorer = require(path.join(__dirname, 'src/modules/getBlockExplorer'))
const linkIcon = require(path.join(__dirname, 'src/modules/getLinkIcon'))
// read config files
const configPath = path.join(__dirname, 'src/config/config.hjson')
const postsPath = path.join(__dirname, 'src/data/posts/')
const linksPath = path.join(__dirname, 'src/data/links.hjson')
const cryptoPath = path.join(__dirname, 'src/data/crypto.hjson')
// read posts file
const readConfig = fs.readFileSync(configPath, 'utf8')
const readPosts = fs.readdirSync(postsPath, 'utf-8')
const readLinks = fs.readFileSync(linksPath, 'utf8')
const readCrypto = fs.readFileSync(cryptoPath, 'utf8')
// posts variables
const config = hjson.parse(readConfig)
const links = hjson.parse(readLinks)
const crypto = hjson.parse(readCrypto)
// app engine
const app = express()
//
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
// cookie parser
app.use(cookieParser());
app.use(session({
    secret: 'youngsoni',
    saveUninitialized: false,
    resave: false
}))
// cors middleware
app.use(cors())
// config variables
const port = config.node.port
// redirect to custom css folder
app.use('/public/css', express.static(__dirname + '/public/css'))
// redirect to assets folder
app.use('/public/assets', express.static(__dirname + '/public/assets'))
// redirect to custom javascript folder
app.use('/public/js', express.static(__dirname + '/public/js'))
// redirect to webui custom css folder
app.use('/webui/public/css', express.static(__dirname + '/views/webui/public/css'))
// redirect to webui assets folder
app.use('/webui/public/assets', express.static(__dirname + '/views/webui/public/assets'))
// redirect to webui custom javascript folder
app.use('/webui/public/js', express.static(__dirname + '/views/webui/public/js'))
// redirect to bootstrap icons
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap'))
// redirect to fork-awesome icons
app.use('/fork-awesome', express.static(__dirname + '/node_modules/fork-awesome'))
// redirect to cryptocurrency icons
app.use('/crypto-icons', express.static(__dirname + '/node_modules/crypto-icons'))
// redirect jQuery
app.use('/jquery', express.static(__dirname + '/node_modules/jquery'))
// sets app engine directory
nunjucks.configure('views', {
    autoescape: true,
    express: app
});
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
// sorts the post paths
var sortedPostPath = []
for (var i = 0; i < sortedPosts.length; i++) {
    for (var j = 0; j < postPath.length; j++) {
        var readFile = fs.readFileSync(postPath[j], 'utf-8')
        var post = fm(readFile)
        if (post.attributes.title == sortedPosts[i].attributes.title) {
            sortedPostPath.push(postPath[j])
        }
    }
}
// stores hashids
var id = []
// number of post per page
const postPerPage = config.blog.postPerPage
const pages = Math.min(sortedPosts.length / postPerPage)
// webui items per page
const webuiItemsPerPage = 10
// templating engine
app.set('view engine', 'html')
// default page
app.get('/', function (req, res) {
    res.render('_site/index')
});
// index page
app.get('/index.html', function (req, res) {
    res.render('_site/index')
});
// seperate pages
for (let i = 0; i < pages; i++) {
    let page = i + 1
    app.get('/page/' + page + '.html', function (req, res) {
        res.render('_site/page/' + page + '.html')
    });
}
// author page
if (config.site.about.length > 200) {
    app.get('/author.html', function (req, res) {
        res.render('_site/author.html')
    });
}
// links page
if (links.length > 5) {
    app.get('/links.html', function (req, res) {
        res.render('_site/links.html')
    });
}
// crypto page
if (crypto.length > 5) {
    app.get('/crypto.html', function (req, res) {
        res.render('_site/crypto.html')
    });
}
// post pages
for (let i = 0; i < sortedPosts.length; i++) {
    id[i] = hashids.encode(sortedPosts[i].attributes.timestamp)
    app.get('/post/' + id[i] + '.html', function (req, res) {
        res.render('_site/post/' + id[i] + '.html')
    })
}
// rss file
if (config.rss.enabled) {
    app.get('/rss.xml', function (req, res) {
        res.render('_site/rss.xml')
    })
}
// webui index page
app.get('/webui', function (req, res) {
    res.render('webui/index', { config: config, posts: sortedPosts, links: links, crypto: crypto, success: req.session.success, successMsg: req.session.successMsg, errors: req.session.errors })
    req.session.errors = null
    req.session.success = null
})
// webui posts page
const webuiPostPages = Math.ceil(sortedPosts.length / webuiItemsPerPage)
app.get('/webui/posts/:page?', function (req, res) {
    var page = req.params.page
    if (page == null) {
        page = 1
    }
    res.render('webui/posts', { config: config, posts: sortedPosts, currentPage: page, totalPages: webuiPostPages, pagesPerItem: webuiItemsPerPage, success: req.session.success, successMsg: req.session.successMsg, errors: req.session.errors })
    req.session.errors = null
    req.session.success = null
})
// webui links page
const webuiLinkPages = Math.ceil(links.length / webuiItemsPerPage)
app.get('/webui/links/:page?', function (req, res) {
    var page = req.params.page
    if (page == null) {
        page = 1
    }
    res.render('webui/links', { config: config, links: links, currentPage: page, totalPages: webuiLinkPages, pagesPerItem: webuiItemsPerPage, success: req.session.success, successMsg: req.session.successMsg, errors: req.session.errors })
    req.session.errors = null
    req.session.success = null
})
// add a new post
app.post('/webui/posts/add',
    [
        check('title')
            .not()
            .isEmpty()
            .withMessage('Title is required'),
        check('body')
            .not()
            .isEmpty()
            .withMessage('Body is required')
    ], (req, res) => {
        var errors = validationResult(req).array()
        if (errors.length > 0) {
            req.session.errors = errors
            req.session.success = false
            res.redirect('/webui/posts')
        } else {
            const splitTags = (req.body.tags).split(',')
            var tags = ""
            for (var i = 0; i < splitTags.length; i++) {
                tags += "- " + splitTags[i].trim() + "\n"
            }
            var newPost = "---\n" +
                "title: " + req.body.title + "\n" +
                "timestamp: " + Math.floor(Date.now() / 1000) + "\n" +
                "tags:" + "\n" +
                tags +
                "---\n\n" +
                req.body.body
            sortedPosts.unshift(fm(newPost))
            var newPostPath = path.join(postsPath, Math.floor(Date.now() / 1000) + ".md")
            sortedPostPath.unshift(newPostPath)
            fs.writeFileSync(path.join(postsPath, Math.floor(Date.now() / 1000) + ".md"), newPost)
            req.session.success = true
            req.session.successMsg = 'Post was added successfully'
            res.redirect('/webui/posts')
        }
    })
// edit an existing post
app.post('/webui/posts/edit',
    [
        check('title')
            .not()
            .isEmpty()
            .withMessage('Title is required'),
        check('body')
            .not()
            .isEmpty()
            .withMessage('Body is required')
    ], (req, res) => {
        var errors = validationResult(req).array()
        if (errors.length > 0) {
            req.session.errors = errors
            req.session.success = false
            res.redirect('/webui/posts')
        } else {
            const splitTags = (req.body.tags).split(',')
            var tags = ""
            for (var i = 0; i < splitTags.length; i++) {
                tags += "- " + splitTags[i].trim() + "\n"
            }
            var editedPost = "---\n" +
                "title: " + req.body.title + "\n" +
                "timestamp: " + req.body.timestamp + "\n" +
                "tags:" + "\n" +
                tags +
                "---\n\n" +
                req.body.body
            sortedPosts[req.body.position] = fm(editedPost)
            fs.writeFileSync(sortedPostPath[req.body.position], editedPost)
            req.session.success = true
            req.session.successMsg = 'Post was edited successfully'
            res.redirect('/webui/posts')
        }
    })
// delete an existing post
app.post('/webui/posts/delete', function (req, res) {
    req.session.success = true
    req.session.successMsg = 'Post was deleted successfully'
    fs.unlinkSync(sortedPostPath[req.body.position])
    sortedPosts.splice(req.body.position, req.body.position + 1)
    sortedPostPath.splice(req.body.position, req.body.position + 1)
    res.redirect('/webui/posts')
})
// add a new link
app.post('/webui/links/add',
    [
        check('name')
            .not()
            .isEmpty()
            .withMessage('Name is required'),
        check('url')
            .not()
            .isEmpty()
            .withMessage('URL is required')
    ], (req, res) => {
        var errors = validationResult(req).array()
        if (errors.length > 0) {
            //console.log(errors)
            req.session.errors = errors
            req.session.success = false
            res.redirect('/webui/links')
        } else {
            links.push({ 'name': req.body.name, 'icon': linkIcon.get(req.body.url), 'url': req.body.url })
            fs.writeFileSync(linksPath, hjson.stringify(links))
            req.session.success = true
            req.session.successMsg = 'Link was added successfully'
            res.redirect('/webui/links')
        }
    })
// edit an existing link
app.post('/webui/links/edit',
    [
        check('name')
            .not()
            .isEmpty()
            .withMessage('Name is required'),
        check('url')
            .not()
            .isEmpty()
            .withMessage('URL is required')
    ], (req, res) => {
        var errors = validationResult(req).array()
        if (errors.length > 0) {
            req.session.errors = errors
            req.session.success = false
            res.redirect('/webui/links')
        } else {
            links[req.body.position].name = req.body.name
            links[req.body.position].icon = linkIcon.get(req.body.url)
            links[req.body.position].url = req.body.url
            fs.writeFileSync(linksPath, hjson.stringify(links))
            req.session.success = true
            req.session.successMsg = 'Link was edited successfully'
            res.redirect('/webui/links')
        }
    })

// delete an existing link
app.post('/webui/links/delete', function (req, res) {
    req.session.success = true
    req.session.successMsg = 'Link was deleted successfully'
    links.splice(req.body.position, req.body.position + 1)
    fs.writeFileSync(linksPath, hjson.stringify(links))
    res.redirect('/webui/links')
})
// webui crypto page
const webuiCryptoPages = Math.ceil(crypto.length / webuiItemsPerPage)
app.get('/webui/crypto/:page?', function (req, res) {
    var page = req.params.page
    if (page == null) {
        page = 1
    }
    res.render('webui/crypto', { config: config, crypto: crypto, currentPage: page, totalPages: webuiCryptoPages, pagesPerItem: webuiItemsPerPage, success: req.session.success, successMsg: req.session.successMsg, errors: req.session.errors })
    req.session.errors = null
    req.session.success = null
})
// add a new crypto
app.post('/webui/crypto/add',
    [
        check('name')
            .not()
            .isEmpty()
            .withMessage('Name is required'),
        check('address')
            .not()
            .isEmpty()
            .withMessage('Wallet address is required')
    ], (req, res) => {
        var errors = validationResult(req).array()
        if (errors.length > 0) {
            req.session.errors = errors
            req.session.success = false
            res.redirect('/webui/crypto')
        } else {
            crypto.push({ 'name': req.body.name, 'icon': cryptoIcon.get(req.body.name), 'address': req.body.address, 'explorer': blockExplorer.get(req.body.name) })
            fs.writeFileSync(cryptoPath, hjson.stringify(crypto))
            req.session.success = true
            req.session.successMsg = 'Crypto address was added successfully'
            res.redirect('/webui/crypto')
        }
    })
// edit an existing crypto
app.post('/webui/crypto/edit',
    [
        check('name')
            .not()
            .isEmpty()
            .withMessage('Name is required'),
        check('address')
            .not()
            .isEmpty()
            .withMessage('Crypto address is required')
    ], (req, res) => {
        var errors = validationResult(req).array()
        if (errors.length > 0) {
            req.session.errors = errors
            req.session.success = false
            res.redirect('/webui/crypto')
        } else {
            crypto[req.body.position].name = req.body.name
            crypto[req.body.position].icon = cryptoIcon.get(req.body.name)
            crypto[req.body.position].address = req.body.url
            crypto[req.body.position].explorer = blockExplorer.get(req.body.name)
            fs.writeFileSync(cryptoPath, hjson.stringify(crypto))
            req.session.success = true
            req.session.successMsg = 'Crypto address was edited successfully'
            res.redirect('/webui/crypto')
        }
    })
// delete an existing crypto
app.post('/webui/crypto/delete', function (req, res) {
    req.session.success = true
    req.session.successMsg = 'Crypto address was deleted successfully'
    crypto.splice(req.body.position, req.body.position + 1)
    fs.writeFileSync(cryptoPath, hjson.stringify(crypto))
    res.redirect('/webui/crypto')
})
// webui config page
app.post('/webui/config', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]),
    [
        check('title')
            .not()
            .isEmpty()
            .withMessage('Title is required'),
        check('author')
            .not()
            .isEmpty()
            .withMessage('Name is required'),
        check('postPerPage')
            .not()
            .isEmpty()
            .withMessage('There must be at least 1 post per page')
    ], (req, res) => {
        var errors = validationResult(req).array()
        if (errors.length > 0) {
            req.session.errors = errors
            req.session.success = false
            res.redirect('/webui')
        } else {
            config.site.title = req.body.title
            if (req.files['logo'] != undefined) {
                var oldPath = req.files['logo'][0].path
                if (req.files['logo'][0].mimetype == 'image/svg+xml') {
                    var newPath = req.files['logo'][0].path + '.svg'
                } else {
                    var newPath = req.files['logo'][0].path
                }
                fs.renameSync(oldPath, newPath)
                config.site.logo = newPath
            }
            if (req.files['favicon'] != undefined) {
                config.site.favicon = req.files['favicon'][0].path
            }
            config.site.description = req.body.description
            config.site.keywords = (req.body.keywords).trim().split(',')
            config.site.author = req.body.author
            config.blog.postPerPage = req.body.postPerPage
            if (req.files['avatar'] != undefined) {
                config.site.avatar = req.files['avatar'][0].path
            }
            config.site.about = req.body.about
            fs.writeFileSync(configPath, hjson.stringify(config))
            //console.log(hjson.stringify(config))
            req.session.success = true
            req.session.successMsg = 'Configuration was edited successfully'
            res.redirect('/webui')
        }
    })
// http error 400 (bad request)
app.get('*', function (req, res) {
    res.status(400).render('_site/error/400.html')
})
// http error 401 (unauthorized)
app.get('*', function (req, res) {
    res.status(401).render('_site/error/401.html')
})
// http error 403 (forbidden)
app.get('*', function (req, res) {
    res.status(403).render('_site/error/403.html')
})
// http error 404 (not found)
app.get('*', function (req, res) {
    res.status(404).render('_site/error/404.html')
})
// http error 500 (internal server error)
app.get('*', function (req, res) {
    res.status(500).render('_site/error/500.html')
})
// start the server
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
    console.log('Press Ctrl+C to quit.')
})