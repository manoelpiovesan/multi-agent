import {BelongsTo, Column, DataType, ForeignKey, HasMany, Table} from "sequelize-typescript";
import {CreationOptional} from "sequelize";
import {AbstractUuidModel} from "./api/abstract_uuid_model";
import {User} from "./api/user";
import {SupervisorModel} from "./supervisor_model";
import {SubagentModel} from "./subagent_model";
import {MessageModel} from "./message_model";

@Table({
  tableName: 'threads',
  timestamps: true,
})
export class ThreadModel extends AbstractUuidModel<ThreadModel> {

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  user_id!: string;

  @ForeignKey(() => SupervisorModel)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  supervisor_id?: CreationOptional<string | null>;

  @ForeignKey(() => SubagentModel)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  subagent_id?: CreationOptional<string | null>;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  title?: CreationOptional<string>;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: CreationOptional<Record<string, unknown>>;

  @BelongsTo(() => User)
  user?: CreationOptional<User>;

  @BelongsTo(() => SupervisorModel)
  supervisor?: CreationOptional<SupervisorModel>;

  @BelongsTo(() => SubagentModel)
  subagent?: CreationOptional<SubagentModel>;

  @HasMany(() => MessageModel)
  messages?: CreationOptional<MessageModel[]>;
}