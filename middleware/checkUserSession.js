const userSchema = require('../model/userSchema')

async function checkUser (req, res, next) {
  try {
    if (req.session.user) {
      const userDetails = await userSchema.findById(req.session.user)
      if (userDetails && userDetails.isActive) {
        next()
      } else {
        req.session.user = ''
        res.redirect('/user/login')
      }
    } else {
      next()
    }
  } catch (err) {
    console.log(`Error in checkuser Middleware  ${err}`)
  }
}

module.exports = checkUser
