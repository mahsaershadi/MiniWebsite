import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../utils/database';
import bcrypt from 'bcryptjs';


interface UserAttributes {
  id: number;
  username: string;
  password: string;
  status: number;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public password!: string;
  public status!: number;

  public async comparePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1 // 1 = active, -1 = deleted
  }
}, {
  sequelize,
  tableName: 'users',
  defaultScope: {
    where: {
      status: 1
    },
    attributes: {
      exclude: ['password']
    }
  },
  scopes: {
    withPassword: {
      where: {
        status: 1
      }
    },
    deleted: {
      where: {
        status: -1
      }
    },
    all: {}
  },
  hooks: {
    beforeCreate: async (user: User) => {
      user.password = await bcrypt.hash(user.password, 10);
    },
    beforeUpdate: async (user: User) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

export default User;