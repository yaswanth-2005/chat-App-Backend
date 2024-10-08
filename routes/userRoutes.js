const express = require('express')
const { registerUser, authUser, allUsers } = require('../controllers/userControllers')
const { protect } = require('../Middleware/authMiddleware')

const router = express.Router()

// router.route("/").post(registerUser)
// router.post('/', registerUser)
router.route('/').post(registerUser).get(protect, allUsers)
router.post('/login', authUser)

module.exports = router