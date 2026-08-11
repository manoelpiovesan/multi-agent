import {BelongsTo, Column, DataType, ForeignKey, Table} from "sequelize-typescript";
import {CreationOptional, NonAttribute} from "sequelize";
import {AbstractUuidModel} from "./api/abstract_uuid_model";
import {ThreadModel} from "./thread_model";

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

@Table({
  tableName: 'messages',
  timestamps: true,
})
export class MessageModel extends AbstractUuidModel<MessageModel> {

  @ForeignKey(() => ThreadModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  thread_id!: string;

  @Column({
    type: DataType.ENUM(...Object.values(MessageRole)),
    allowNull: false,
  })
  role!: MessageRole;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content!: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: CreationOptional<Record<string, unknown>>;

  @BelongsTo(() => ThreadModel)
  thread?: NonAttribute<ThreadModel>;
}
