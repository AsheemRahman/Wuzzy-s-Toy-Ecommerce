const productSchema = require('../../model/productSchema')
const collectionSchema = require('../../model/collection.model')


//----------------------------------- Home page render --------------------------------

const home = async (req, res) => {
  try {
    const product = await productSchema.find()
    res.render('user/home', { title: 'Home', product , user:req.session.user })
  } catch (error) {
    console.log(`error while rendering home ${error}`)
  }
}


//--------------------------------------- Explore Page ---------------------------------

const allproduct = async (req, res) => {
  try {
    const product = await productSchema.find()

    res.render('user/allproduct', { title: 'All Product', product , user:req.session.user })
  } catch (error) {
    console.log(`error from explore rendering ${error}`)
  }
}

module.exports = { home , allproduct }
