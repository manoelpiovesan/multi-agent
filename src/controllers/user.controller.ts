import {Get, Queries, Request, Route, Security, Tags, Post, Controller, Body} from 'tsoa';
import {DefaultSearchParams} from "../types/api/search_types";
import {AuthRepository, AuthTokens} from "../repositories/auth.repository";
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
  @Security('google-jwt')
  public async me(
    @Request() request: Express.Request,
  ): Promise<APIUser> {
    return request.jwt_user!;
  }

  /**
   * Refresh JWT token
   * @param request
   * @param refresh_token
   */
  @Post('refresh-token')
  @Security('google-jwt')
  public async refreshToken(
    @Request() request: Express.Request,
    @Body() refresh_token: string,
  ): Promise<AuthTokens> {
    const tokens = await AuthRepository.refreshToken(request.jwt_user!.id, refresh_token);

    if(!tokens) {
      this.setStatus(401);
      return Promise.reject(new Error('Invalid or expired refresh token'));
    }

    return tokens;
  }

  /**
   * Get all users - For admin users only
   * @param params
   */
  @Get()
  @Security('google-jwt', ['admin'])
  public async getAll(
    @Queries() params: DefaultSearchParams
  ): Promise<APIUser[]> {
    return UserRepository.findAll(params);
  }

}
