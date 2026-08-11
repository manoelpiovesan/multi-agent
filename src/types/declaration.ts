import {APIUser} from "./api/user_types";

declare global {
  namespace Express {
    interface Request {
      jwt_user?: APIUser;
    }
  }
}
