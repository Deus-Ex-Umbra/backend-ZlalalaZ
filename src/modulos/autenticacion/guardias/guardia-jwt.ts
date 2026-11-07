import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GuardiaJwt extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser,
    _info: unknown,
  ): TUser {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          "ERR-AUTH-002: Token expirado, ausente o inválido",
        )
      );
    }
    return user;
  }
}
