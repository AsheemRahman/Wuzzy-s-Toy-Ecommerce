const productSchema = require('../../model/productSchema')
const upload = require('../../middleware/multer')
const collectionSchema = require('../../model/collectionSchema')
const fs = require('fs');


//------------------------------ Find Product by Search -----------------------------

const product = async (req,res) => {
    try {
        
        const search = req.query.search || "";
        const products = await productSchema.find({productName: {$regex: search, $options: 'i'}})
        res.render('admin/products',{title: 'Products',products})
    } catch (error) {
        console.log(`error from product page ${error}`)
    }
}

//---------------------------------- Add Product Render---------------------------------

const addProduct = async (req,res) => {
    try {
        
        const productCollection = await collectionSchema.find()

        res.render('admin/addProduct',{title: "Add Product",productCollection})

    } catch (error) {
        console.log(`error while rendering addproduct page ${error}`)
    }
}


//------------------------------------ Multer upload ---------------------------------

const multer = upload.array('image',3);


//----------------------------------- add New product --------------------------------

const addproductPost = async (req,res) => {
    try {
        
        const imgArray = []

        req.files.forEach((img) =>{
            imgArray.push(img.path)
        })

        const product={
            productName: req.body.productName,
            productPrice: req.body.productPrice,
            productCollection: req.body.productCollection,
            productQuantity: req.body.productQuantity,
            productDiscount: req.body.productDiscount,
            productDescription: req.body.productDescription,
            productImage: imgArray
        }
        
        const check = await productSchema.findOne({productName: product.productName, productCollection: product.productCollection, })

        if(!check){
            await productSchema.insertMany(product);
            req.flash('success','Product Successfully added')
        }else{
            req.flash('error','Product already exists')
        }
        res.redirect('/admin/products')

    } catch (error) {
        console.log(`error while adding product ${error}`)
        req.flash('error','Failed to added product')
        res.redirect('/admin/addproduct')
        
    }
}

//----------------------------------- Edit Product page render -----------------------------------

const editProduct = async (req,res) => {
    
    try {
    
        const id = req.params.id;
        const product = await productSchema.findById(id)
        if(product){
            res.render('admin/editproduct',{title:'Edit Product',product})
        }else{
            req.flash('error','Unable to edit product')
            res.redirect('/admin/products')
        }

    } catch (error) {
        console.log(`error while loading edit product page ${error}`)
    }
}


//----------------------------------- Edit Product  -----------------------------------

const editProductPost = async (req,res)=> {
    try {
        
        const id = req.params.id;
        productSchema.findByIdAndUpdate(id,{
            productPrice: req.body.productPrice,
            productQuantity: req.body.productQuantity,
            productDiscount:req.body.productDiscount,
            productDescription: req.body.productDescription})
        .then(()=>{
            req.flash('success','Product successfully updated')
            res.redirect('/admin/products')
        }).catch((err)=>{
            req.flash('error','Error occured while editing the product')
            res.redirect('/admin/products')
        })
    } catch (error) {
        console.log(`error while editing product post ${error} `)
        req.flash('error',"Could not edit the product")
        res.redirect('/admin/products')
    }
}

//------------------------------------ Product Status ----------------------------------

const status = async (req,res)=> {
    try {
        const{ id,status} = req.query;
        const newStatus = !(status === 'true')

        await productSchema.findByIdAndUpdate(id,{isActive: newStatus})
        res.redirect('/admin/products')

    } catch (error) {
        console.log(`error while changing status ${error}`)
    }
}


//------------------------------------ Delete Product -----------------------------------

const deleteProduct =async (req,res)=>{
    try {
        
        const id = req.params.id;
        const img = await productSchema.findById(id)
        img.productImage.forEach((x)=>{
            fs.unlinkSync(x)
        })
        const product = await productSchema.findByIdAndDelete(id)
        if(product != null){
            req.flash('success','Product successfully removed')
            res.redirect('/admin/products')
        }else{
            req.flash('error','Couldnt delete the product')
            res.redirect('/admin/products')
        }

    } catch (error) {
        console.log(`error while deleting the product ${error}`)
    }
}

module.exports = {product,deleteProduct,status,addProduct,multer,addproductPost,editProduct,editProductPost}