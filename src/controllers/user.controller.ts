import {Get, Queries, Request, Route, Security, Tags, Controller} from 'tsoa';
import {UserRole} from "../models/api/user";
import {DefaultSearchParams} from "../types/api/search_types";
import {UserRepository} from "../repositories/user.repository";
import {APIUser} from "../types/api/user_types";

@Route('users')
@Tags('Users')
export class UserController extends Controller {

  /**
   * Get current authenticated user
   * @param request
   */
  @Get('me')
  @Security('jwt')
  public async me(
    @Request() request: Express.Request,
  ): Promise<APIUser> {
    return request.jwt_user!;
  }

  /**
   * Get all users - For admin users only
   * @param params
   */
  @Get()
  @Security('jwt', [UserRole.ADMIN])
  public async getAll(
    @Queries() params: DefaultSearchParams
  ): Promise<APIUser[]> {
    return UserRepository.findAll(params);
  }

}
