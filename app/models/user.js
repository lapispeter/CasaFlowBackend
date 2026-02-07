import { DataTypes } from 'sequelize'
import sequelize from '../database/database.js'

const User = sequelize.define('user', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  email: {
    type: DataTypes.STRING,
    allowNull: true
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  roleId: {
    type: DataTypes.INTEGER,
    defaultValue: 0 // 0=user, 1=admin
  },

  // ✅ Aktivitás figyelés (admin statisztika: aktív/passzív)
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },

  // 🌸 Email megerősítéshez
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  verificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },

  verificationTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // 🌸 Elfelejtett jelszóhoz
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },

  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }
})

export default User
