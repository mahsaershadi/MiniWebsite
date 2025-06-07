import { Model, DataTypes } from 'sequelize';
import sequelize from '../utils/database';

export enum FilterType {
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  RANGE = 'range',
  BOOLEAN = 'boolean'
}

class CategoryFilter extends Model {
  public id!: number;
  public category_id!: number;
  public name!: string;
  public type!: FilterType;
  public options?: string[]; 
  public min?: number;      
  public max?: number;     
  public required!: boolean;
  public order!: number;   
  public status!: number;  
}

CategoryFilter.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(...Object.values(FilterType)),
    allowNull: false,
  },
  options: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  min: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  max: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  }
}, {
  sequelize,
  modelName: 'category_filter',
  underscored: true,
  timestamps: false
});

export default CategoryFilter;