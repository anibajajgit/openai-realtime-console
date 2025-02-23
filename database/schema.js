
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

export { Role, Scenario };
