/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: keyof any, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
