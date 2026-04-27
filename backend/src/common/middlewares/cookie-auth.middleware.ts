import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CookieAuthMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    if (
      !req.headers.authorization &&
      req.cookies &&
      (req.cookies as Record<string, string>)['accessToken']
    ) {
      req.headers.authorization = `Bearer ${(req.cookies as Record<string, string>)['accessToken']}`;
    }
    next();
  }
}
