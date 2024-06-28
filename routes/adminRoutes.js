const express = require('express')
const admin = express.Router();
const isAdmin = require('../middleware/adminSession')
const adminController = require('../controller/adminController/adminController')
const categoryController = require('../controller/adminController/categoryController')
const productController = require('../controller/adminController/productController')
const userContoller = require('../controller/adminController/userController')
const orderController = require('../controller/adminController/orderController')


//-----------------------------  login  ----------------------------

admin.get('/',adminController.admin)
admin.get('/login',adminController.login)
admin.post('/login',adminController.loginPost);


//------------------------ admin home page --------------------------

admin.get('/home',isAdmin,adminController.home)


//-------------------------- collection -----------------------------

admin.get('/collection',isAdmin,categoryController.category)
admin.post('/addcollection',isAdmin,categoryController.addCategoryPost)
admin.get('/deletecollection/:id',isAdmin,categoryController.deleteCategory)
admin.get('/collectionstatus',isAdmin,categoryController.status)
admin.post('/editcollection',isAdmin,categoryController.editCategory)


//----------------------------- product -----------------------------

admin.get('/products',isAdmin,productController.product)
admin.get('/products/:id',isAdmin,productController.deleteProduct)
admin.get('/productstatus',isAdmin,productController.status)

//-------- add product ---------//
admin.get('/addproduct',isAdmin,productController.addProduct)
admin.post('/addproduct',productController.multer,productController.addproductPost)
//------- edit product ---------//
admin.get('/editproduct/:id',isAdmin,productController.editProduct)
admin.post('/editproduct/:id',isAdmin,productController.multer,productController.editProductPost)


//--------------------------- user details ----------------------------

admin.get('/users',isAdmin,userContoller.users)
admin.get('/userstatus',isAdmin,userContoller.status)


// ------------------------------ Order  ------------------------------

admin.get('/order', isAdmin , orderController.orderpage)
admin.get("/order-view/:id", orderController.orderView)
admin.post("/order/:orderId/status",orderController.orderStatus)


//---------------------------- admin logout ----------------------------

admin.get('/logout',adminController.logout)


module.exports = admin