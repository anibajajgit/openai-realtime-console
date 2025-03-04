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
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  }
}, {
  timestamps: true
});

const Transcript = sequelize.define('Transcript', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    defaultValue: 'Conversation'
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Roles',
      key: 'id'
    }
  },
  scenarioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Scenarios',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending' // pending, completed, failed
  },
  transcriptId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Transcripts',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

// Define associations
User.hasMany(Transcript, { foreignKey: 'userId' });
Transcript.belongsTo(User, { foreignKey: 'userId' });

// Add missing associations for Role and Scenario
Role.hasMany(Transcript, { foreignKey: 'roleId' });
Transcript.belongsTo(Role, { foreignKey: 'roleId' });

Scenario.hasMany(Transcript, { foreignKey: 'scenarioId' });
Transcript.belongsTo(Scenario, { foreignKey: 'scenarioId' });

Transcript.hasOne(Feedback, { foreignKey: 'transcriptId' });
Feedback.belongsTo(Transcript, { foreignKey: 'transcriptId' });

export { Role, Scenario, User, Transcript, Feedback };