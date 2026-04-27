import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { CreateGameEntryDto } from './dto/create-game-entry.dto';
import {
  GAME_ENTRY_REPOSITORY,
  GameEntryEntity,
  GameEntryRepositoryInterface,
} from './interfaces/game-entry.repository.interface';

@ApiBearerAuth()
@ApiTags('game-entries')
@Controller('sessions/:sessionId/games')
export class GameEntryController {
  constructor(
    @Inject(GAME_ENTRY_REPOSITORY)
    private readonly gameEntryRepository: GameEntryRepositoryInterface,
  ) {}

  @Post()
  @Audit(AuditAction.GAME_ENTRY_CREATED, 'Game entry added to session')
  @ApiOperation({ summary: 'Add a game entry to a session' })
  @ApiResponse({ status: 201, description: 'Game entry created' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async create(
    @CurrentUser() userId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateGameEntryDto,
  ): Promise<GameEntryEntity> {
    return this.gameEntryRepository.create(sessionId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all game entries for a session' })
  @ApiResponse({ status: 200, description: 'Game entries returned' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async findBySession(
    @CurrentUser() userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<GameEntryEntity[]> {
    return this.gameEntryRepository.findBySession(sessionId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit(AuditAction.GAME_ENTRY_DELETED, 'Game entry deleted')
  @ApiOperation({ summary: 'Delete a game entry' })
  @ApiResponse({ status: 204, description: 'Game entry deleted' })
  @ApiResponse({ status: 404, description: 'Game entry not found' })
  async delete(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.gameEntryRepository.delete(id, userId);
  }
}
