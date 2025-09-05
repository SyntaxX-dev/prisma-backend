import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UserController {
  // Controller vazio - endpoints removidos
}
 