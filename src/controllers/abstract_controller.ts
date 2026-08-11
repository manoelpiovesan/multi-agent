import {Controller} from "tsoa";
import {DefaultSearchParams} from "../types/api/search_types";

export abstract class AbstractController<ID, Att, CreationAtt> extends Controller {
  // Get all
  abstract getAll(params: DefaultSearchParams): Promise<Att[]>;

  // Get by ID
  abstract getById(id: ID): Promise<Att>;

  // Update
  abstract update(id: ID, data: Partial<CreationAtt>): Promise<Att>;

  // Create
  abstract create(data: CreationAtt): Promise<Att>;

  // Delete
  abstract delete(id: ID): Promise<void>;
}
