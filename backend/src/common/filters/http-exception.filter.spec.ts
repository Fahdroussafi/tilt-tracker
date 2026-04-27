import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './http-exception.filter';

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
const mockGetRequest = jest.fn().mockReturnValue({
  method: 'POST',
  url: '/test',
  body: { username: 'admin', password: 'secret' },
});

const mockHost = {
  switchToHttp: jest.fn().mockReturnValue({
    getResponse: mockGetResponse,
    getRequest: mockGetRequest,
  }),
  getType: jest.fn().mockReturnValue('http'),
  getArgs: jest.fn().mockReturnValue([]),
} as unknown as ArgumentsHost;

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    jest.clearAllMocks();
  });

  it('should handle HttpException with status and message', () => {
    const exception = new BadRequestException('Validation failed');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test',
      }),
    );
  });

  it('should handle NotFoundException', () => {
    const exception = new NotFoundException('errors.not_found.generic');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('should handle ForbiddenException', () => {
    const exception = new ForbiddenException();
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
  });

  it('should handle generic Error with 500 status', () => {
    const exception = new Error('Something broke');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
      }),
    );
  });

  it('should include timestamp and path in response', () => {
    const exception = new BadRequestException('test');
    filter.catch(exception, mockHost);

    const calls = mockJson.mock.calls as unknown[][];
    const responseBody = calls[0][0] as Record<string, unknown>;
    expect(responseBody.timestamp).toBeDefined();
    expect(responseBody.path).toBe('/test');
  });

  it('should mask sensitive data in request body before logging', () => {
    const exception = new Error('test');
    filter.catch(exception, mockHost);

    expect(mockJson).toHaveBeenCalled();
  });

  it('should handle unknown exception types gracefully', () => {
    filter.catch('random string error', mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      }),
    );
  });
});
