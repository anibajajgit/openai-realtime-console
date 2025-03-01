
import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  title: DataTypes.STRING,
  style: DataTypes.STRING,
  photoUrl: DataTypes.STRING,
  voice: DataTypes.STRING,
  instructions: DataTypes.TEXT
});

const Scenario = sequelize.define('Scenario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  description: DataTypes.TEXT,
  instructions: DataTypes.TEXT,
  rubric: {
    type: DataTypes.JSON,
    defaultValue: []
  }
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    unique: true
  },
  password: DataTypes.STRING
}, {
  timestamps: true
});

export { Role, Scenario, User };
