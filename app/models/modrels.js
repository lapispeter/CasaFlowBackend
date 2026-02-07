import sequelize from '../database/database.js';
import User from './user.js';
import Bill from './bill.js';
import MeterReading from './meterReading.js';
import Reminder from './reminder.js';
import ShoppingList from './shoppingList.js';
import SystemMessage from './systemMessage.js';

const db = {};

db.User = User;
db.Bill = Bill;
db.MeterReading = MeterReading;
db.Reminder = Reminder;
db.ShoppingList = ShoppingList;
db.SystemMessage = SystemMessage;

// ✅ Kapcsolatok (1 User -> sok Bill)
User.hasMany(Bill, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Bill.belongsTo(User, {
  foreignKey: 'userId'
});

User.hasMany(MeterReading, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

MeterReading.belongsTo(User, {
  foreignKey: 'userId'
});

User.hasMany(Reminder, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Reminder.belongsTo(User, {
  foreignKey: 'userId'
});

User.hasMany(ShoppingList, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

ShoppingList.belongsTo(User, {
  foreignKey: 'userId'
});

// ✅ SQLite + alter:true esetén gyakori FK gond -> sync idejére kikapcsoljuk
await sequelize.query('PRAGMA foreign_keys = OFF');

await sequelize.sync({
  alter: true
});

await sequelize.query('PRAGMA foreign_keys = ON');

export default db;
