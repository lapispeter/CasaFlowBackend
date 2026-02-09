import { DataTypes } from 'sequelize'

async function up({ context: QueryInterface }) {
  await QueryInterface.createTable('system_messages', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },

    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },

    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  })
}

async function down({ context: QueryInterface }) {
  await QueryInterface.dropTable('system_messages')
}

export { up, down }
