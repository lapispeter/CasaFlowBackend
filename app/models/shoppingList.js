import { DataTypes } from 'sequelize'
import sequelize from '../database/database.js'

const ShoppingList = sequelize.define(
  'ShoppingList',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    note: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1,
    },

    unit: {
      type: DataTypes.STRING,
      allowNull: true, // pl. "db", "kg", "l"
    },

    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    isBought: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    // ✅ userhez tartozik
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'shopping_list',
    timestamps: true,
  }
)

export default ShoppingList
