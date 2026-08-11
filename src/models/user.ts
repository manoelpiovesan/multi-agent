import {Table, Column, DataType, Model, PrimaryKey} from 'sequelize-typescript';
import {CreationOptional, InferAttributes, InferCreationAttributes} from 'sequelize';

@Table({tableName: 'users'})
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {

  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  id: CreationOptional<string>;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  google_profile_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  picture?: CreationOptional<string>;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  role?: CreationOptional<string>;

}


