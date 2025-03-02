import { DataTypes, Model } from 'sequelize';
import sequelize from './index.js';

class User extends Model {}
User.init({
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING
  }
}, {
  sequelize,
  modelName: 'user'
});

class Role extends Model {}
Role.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  instructions: {
    type: DataTypes.TEXT
  },
  voice: {
    type: DataTypes.STRING,
    defaultValue: 'echo'
  }
}, {
  sequelize,
  modelName: 'role'
});

class Scenario extends Model {}
Scenario.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  instructions: {
    type: DataTypes.TEXT
  },
  rubric: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'scenario'
});

class Transcript extends Model {}
Transcript.init({
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    defaultValue: 'Conversation'
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  roleId: {
    type: DataTypes.INTEGER,
    references: {
      model: Role,
      key: 'id'
    }
  },
  scenarioId: {
    type: DataTypes.INTEGER,
    references: {
      model: Scenario,
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'transcript'
});

class TranscriptFeedback extends Model {}
TranscriptFeedback.init({
  content: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  errorMessage: {
    type: DataTypes.TEXT
  },
  transcriptId: {
    type: DataTypes.INTEGER,
    references: {
      model: Transcript,
      key: 'id'
    },
    unique: true
  }
}, {
  sequelize,
  modelName: 'transcript_feedback'
});

// Set up associations
Transcript.belongsTo(User);
Transcript.belongsTo(Role);
Transcript.belongsTo(Scenario);
User.hasMany(Transcript);
Role.hasMany(Transcript);
Scenario.hasMany(Transcript);
Transcript.hasOne(TranscriptFeedback);
TranscriptFeedback.belongsTo(Transcript);

export { User, Role, Scenario, Transcript, TranscriptFeedback };