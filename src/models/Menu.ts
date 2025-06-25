import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '.';

interface MenuAttributes {
  id: number;
  title: string;
  type: 'category' | 'page' | 'link';
  parentId: number | null;
  url: string | null;
  order: number;
  isActive: boolean;
  content?: string;
}

interface MenuCreationAttributes extends Optional<MenuAttributes, 'id'> {}

class Menu extends Model<MenuAttributes, MenuCreationAttributes> implements MenuAttributes {
  public id!: number;
  public title!: string;
  public type!: 'category' | 'page' | 'link';
  public parentId!: number | null;
  public url!: string | null;
  public order!: number;
  public isActive!: boolean;
  public content?: string;
}

Menu.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('category', 'page', 'link'),
      allowNull: false,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Menus',
        key: 'id',
      },
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Menu',
    tableName: 'Menus',
  }
);

export default Menu; 