import { DataTypes, Model, Optional } from "sequelize";  
import sequelize from "../utils/database";

interface CategoryAttributes {
    id: number;
    name: string;
    parentId: number | null;
    status: number;
}

interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'status' | 'parentId'> {}

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public parentId!: number | null;
  public status!: number;

  public readonly subcategories?: Category[];
  public readonly parent?: Category;
}

Category.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  sequelize,
  tableName: 'categories',
  timestamps: false
});

export default Category;