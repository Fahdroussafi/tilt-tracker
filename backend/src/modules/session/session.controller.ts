import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import {
  SESSION_REPOSITORY,
  SessionEntity,
  SessionRepositoryInterface,
} from './interfaces/session.repository.interface';

@ApiBearerAuth()
@ApiTags('sessions')
@Controller('sessions')
export class SessionController {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepositoryInterface,
  ) {}

  @Post()
  @Audit(AuditAction.SESSION_CREATED, 'New gaming session started')
  @ApiOperation({ summary: 'Start a new gaming session' })
  @ApiResponse({ status: 201, description: 'Session created' })
  async create(
    @CurrentUser() userId: string,
    @Body() dto: CreateSessionDto,
  ): Promise<SessionEntity> {
    return this.sessionRepository.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sessions for current user' })
  @ApiResponse({ status: 200, description: 'Sessions list returned' })
  async findAll(@CurrentUser() userId: string): Promise<SessionEntity[]> {
    return this.sessionRepository.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a session by ID' })
  @ApiResponse({ status: 200, description: 'Session returned' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async findOne(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<SessionEntity> {
    const session = await this.sessionRepository.findById(id, userId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  @Patch(':id')
  @Audit(AuditAction.SESSION_UPDATED, 'Session updated')
  @ApiOperation({ summary: 'Update a session' })
  @ApiResponse({ status: 200, description: 'Session updated' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ): Promise<SessionEntity> {
    return this.sessionRepository.update(id, userId, dto);
  }

  @Patch(':id/end')
  @Audit(AuditAction.SESSION_UPDATED, 'Session ended')
  @ApiOperation({ summary: 'End a gaming session' })
  @ApiResponse({ status: 200, description: 'Session ended' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async endSession(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ): Promise<SessionEntity> {
    return this.sessionRepository.endSession(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit(AuditAction.SESSION_DELETED, 'Session deleted')
  @ApiOperation({ summary: 'Delete a session' })
  @ApiResponse({ status: 204, description: 'Session deleted' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async delete(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.sessionRepository.delete(id, userId);
  }
}
