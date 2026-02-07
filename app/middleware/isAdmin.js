import User from '../models/user.js'

const isAdmin = async (req, res, next) => {
  try {
    // ide a verifyToken már betette: req.userId
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized!' })
    }

    const user = await User.findByPk(req.userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found!' })
    }

    // roleId: 1 = admin, 0 = sima user
    if (user.roleId !== 1) {
      return res.status(403).json({ message: 'Admin access required!' })
    }

    // oké, admin
    next()
  } catch (err) {
    console.error('isAdmin error:', err)
    return res.status(500).json({ message: 'Server error in admin check.' })
  }
}

export default isAdmin
