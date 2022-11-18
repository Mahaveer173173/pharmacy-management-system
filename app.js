var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var config = require('./config/database');
var bodyParser = require('body-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
var fileUpload = require('express-fileupload');
var flash = require('connect-flash');
var expressMessages = require('express-messages')

// connect to database
mongoose.connect(config.database);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
    console.log('Connected to MongoDB');
});

// Initialize app
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// set public folder
app.use(express.static(path.join(__dirname, 'public')));

// set global errors variable
app.locals.errors = null;

// get page model
var Page = require('./models/page');

// get all pages to pass to header.ejs
Page.find({}).sort({sorting: 1}).exec(function(err, pages){
    if(err){
        console.log(err);
    }else{
        app.locals.pages = pages;
    }
});

// get category model
var Category = require('./models/category');

// get all categories to pass to header.ejs
Category.find(function(err, categories){
    if(err){
        console.log(err);
    }else{
        app.locals.categories = categories;
    }
});

// express file upload middleware
app.use(fileUpload());

// body parser middleware
app.use(bodyParser.urlencoded({extended: false}));
// parse application
app.use(bodyParser.json());

// express session middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

// express validator middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value){
        var namespace = param.split('.'),
        root = namespace.shift(),
        formParam = root;

        while(namespace.length){
            formParam += '['+namespace.shift()+']';
        }
        return{
            param: formParam,
            msg: msg,
            value: value,
        };
    },
    // custom validator
    customValidators: {
        isImage: function(value, filename){
            var extension = (path.extname(filename)).toLowerCase();
            switch(extension){
                case '.jpg':
                    return '.jpg';
                case '.jpeg':
                    return '.jpeg';
                case '.png':
                    return '.png';
                case '':
                    return '.jpg';
                default:
                    return false;
            }
        }
    }
}));

// express messages middleware
app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = expressMessages(req, res);
  next();
});

app.get('*', function(req, res, next){
    res.locals.cart = req.session.cart;
    next();
})

// set routes
var pages = require('./routes/pages.js');
var products = require('./routes/products.js');
var cart = require('./routes/cart.js');
var adminPages = require('./routes/admin_pages.js');
var adminCategories = require('./routes/admin_categories.js');
var adminProducts = require('./routes/admin_products.js');

// const { title } = require('process');

app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/products', products);
app.use('/cart', cart);
app.use('/', pages);

//start the server
var port = 80;
app.listen(port, function(){
    console.log(`Server running on http://${'localhost'}:${port}`);
});