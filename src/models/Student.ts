import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";
import { sequelize } from "../db/sequelize.js";

export class Student extends Model<InferAttributes<Student>, InferCreationAttributes<Student>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare phone: string;
  declare group: string;
  declare monthlyFee: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Student.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    group: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    monthlyFee: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Student",
    tableName: "students",
  }
);
