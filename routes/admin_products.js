var express = require("express");
var router = express.Router();
var mkdirp = require("mkdirp");
var fs = require("fs-extra");
var resize = require("resize-img");

// Get product model
var Product = require("../models/product");

// Get category model
var Category = require("../models/category");

// Get products index
router.get("/", function (req, res) {
  var count;
  Product.count(function (err, c) {
    count = c;
  });

  Product.find(function (err, products) {
    res.render("admin/products", {
      products: products,
      count: count,
    });
  });
});

// Get add product
router.get("/add-product", function (req, res) {
  var title = "";
  var desc = "";
  var price = "";

  Category.find(function (err, categories) {
    res.render("admin/add_product", {
      title: title,
      desc: desc,
      categories: categories,
      price: price,
    });
  });
});

// Post add product
router.post("/add-product", function (req, res) {

  if(!req.files){
    imageFile = "";
  }
  if(req.files){
    var imageFile = typeof(req.files.image)!=="undefined"?req.files.image.name:"";
  }

  req.checkBody("title", "Title must have a value").notEmpty();
  req.checkBody("desc", "Description must have a value").notEmpty();
  req.checkBody("price", "Price must have a value").isDecimal();
  req.checkBody("image", "You must upload an image").isImage(imageFile);

  var title = req.body.title;
  var slug = title.replace(/\s+/g, "-").toLowerCase();
  var desc = req.body.desc;
  var price = req.body.price;
  var category = req.body.category;

  var errors = req.validationErrors();
  if (errors) {
    Category.find(function (err, categories) {
      res.render("admin/add_product", {
        errors: errors,
        title: title,
        desc: desc,
        categories: categories,
        price: price,
      });
    });
  } else {
    Product.findOne({ slug: slug }, function (err, product) {
      if (product) {
        req.flash("danger", "Product title exists, choose another.");
        Category.find(function (err, categories) {
          res.render("admin/add_product", {
            title: title,
            desc: desc,
            categories: categories,
            price: price,
          });
        });
      } else {
        var price2 = parseFloat(price).toFixed(2);
        var product = new Product({
          title: title,
          slug: slug,
          desc: desc,
          price: price2,
          category: category,
          image: imageFile
        });

        product.save(function (err) {
          if (err) return console.log(err);

          mkdirp("public/product_images/" + product._id, function (err) {
            return console.log(err);
          });

          mkdirp("public/product_images/" + product._id + '/gallery', function (err) {
            return console.log(err);
          });

          mkdirp("public/product_images/" + product._id + '/gallery/thumbs', function (err) {
            return console.log(err);
          });

          if(imageFile != ""){
            var productImage = req.files.image;
            var path = 'public/product_images/'+ product._id + '/' + imageFile;

            productImage.mv(path, function(err){
                return console.log(err);
            });
          }

          req.flash('success', 'Product added!');
          res.redirect("/admin/products");
        });
      }
    });
  }
});

// Get edit product
// router.get("/edit-product/:id", function (req, res) {

//   var errors;
//   if (req.session.errors) errors = req.session.errors;
//   req.session.errors = null;

//   Category.find(function (err, categories) {

//     Product.findById(req.params.id, function(err, p){
//       if(err){
//         console.log(err)
//         res.redirect('/admin/products');
//       }else{
//         var 
//       });

//     res.render("admin/add_product", {
//       title: title,
//       desc: desc,
//       categories: categories,
//       price: price,
//     });
//   });

// });

// // Post edit page
// router.post("/edit-page/:slug", function (req, res) {
//   req.checkBody("title", "Title must have a value").notEmpty();
//   req.checkBody("content", "Content must have a value").notEmpty();

//   var title = req.body.title;
//   var slug = req.body.slug.replace(/\s+/g, "-").toLowerCase();
//   if (slug == "") slug = title.replace(/\s+/g, "-").toLowerCase();
//   var content = req.body.content;
//   var id = req.body.id;

//   var errors = req.validationErrors();
//   if (errors) {
//     res.render("admin/edit_page", {
//       errors: errors,
//       title: title,
//       slug: slug,
//       content: content,
//       id: id,
//     });
//   } else {
//     Page.findOne({ slug: slug, _id: { $ne: id } }, function (err, page) {
//       if (page) {
//         req.flash("danger", "Page slug exists, choose another.");
//         res.render("admin/edit_page", {
//           title: title,
//           slug: slug,
//           content: content,
//           id: id,
//         });
//       } else {
//         Page.findById(id, function (err, page) {
//           if (err) return console.log(err);
//           page.title = title;
//           page.slug = slug;
//           page.content = content;

//           page.save(function (err) {
//             if (err) return console.log(err);

//             req.flash("success", "Page edited!");
//             res.redirect("/admin/pages/edit-page/" + page.slug);
//           });
//         });
//       }
//     });
//   }
// });

// Get delete product
router.get("/delete-product/:id", function (req, res) {
  Product.findByIdAndRemove(req.params.id, function (err) {
    if (err) return console.log(err);
    // req.flash('success', 'Page deleted!');
    res.redirect("/admin/products/");
  });
});

// exports
module.exports = router;
