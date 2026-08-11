import {Table, Column, DataType, Model, PrimaryKey} from 'sequelize-typescript';
import {CreationOptional, InferAttributes, InferCreationAttributes} from 'sequelize';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

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
  password_hash?: CreationOptional<string>;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  picture?: CreationOptional<string>;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    defaultValue: UserRole.USER,
    allowNull: true,
  })
  role?: CreationOptional<UserRole>;
}

