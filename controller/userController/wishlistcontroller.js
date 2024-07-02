const wishlistSchema = require('../../model/wishlistSchema')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const productSchema = require('../../model/productSchema')

const wishlistpage = async(req,res)=>{
    try{
        if (!req.session.user) {
            req.flash('error', "User is Not Found , Please Login Again"  )
            return res.redirect('/user/login');
        }
        const wishlist = await wishlistSchema.findOne({ userID: req.session.user }).populate('products.productID')
        if(wishlist){
            res.render('user/wishlist',{title : "Wishlist" ,products: wishlist.products ,  user: req.session.user })
        }else{
            res.render('user/wishlist', { title: "Wishlist", products: [] , user: req.session.user })
        }
    }catch(error){
        console.log(`Error while render wishlist page ${error}`)
        res.status(400)
    }
}


const addWishlist = async (req, res) => {
    try {
        const productID = req.params.id;
        const userID = req.session.user;

        const Product = await productSchema.findById(productID);

        if (!Product) {
            return res.status(404).json({ error: "Product not found" });
        }
        const wishlist = await wishlistSchema.findOne({ userID }).populate('products.productID');
        if (wishlist) {
            const productExists = wishlist.products.some((item) => item.productID.id === productID);

            if (productExists) {
                return res.status(400).json({ error: "Product already in wishlist" });
            } else {
                wishlist.products.push({ productID: Product._id });
                await wishlist.save();
                return res.status(200).json({ success: "Product added to wishlist" });
            }
        } else {
            const newWishlist = new wishlistSchema({
                userID,
                products: [{ productID: Product._id }]
            });
            await newWishlist.save();
            return res.status(200).json({ success: "Product added to wishlist" });
        }
    } catch (err) {
        console.error(`Error adding product to wishlist: ${err}`);
        return res.status(500).json({ message: "Error adding product to wishlist" });
    }
};

const deleteWishlist = async (req, res) => {
    const userId = req.session.user;
    const itemId = req.params.id;
    // Validate userId and itemId
    if (!userId) {
        req.flash('error', 'User not authenticated.');
        return res.redirect("/user/login");
    }
    if (!itemId || !ObjectId.isValid(itemId)) {
        req.flash('error', 'Invalid item ID.');
        return res.redirect("/user/wishlist");
    }
    try {
        const wish = await wishlistSchema.findOne({ userID: userId });
        if (wish) {
            // Pull the item from the wish
            wish.products.pull({ productID: new ObjectId(itemId) });
            await wish.save();
            req.flash('success', 'Item removed from wishlist.');
        } else {
            console.log('No wishlist found for the specified user.');
            req.flash('error', 'Wishlist not found.');
        }
    } catch (err) {
        req.flash('error', 'Something went wrong. Please try again later.');
        console.error(`Error in removing the item from wishlist: ${err}`);
    }
    res.redirect("/user/wishlist");
}



module.exports = { wishlistpage , addWishlist , deleteWishlist }