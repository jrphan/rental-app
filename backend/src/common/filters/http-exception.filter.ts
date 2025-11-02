import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | undefined;
    let errorName: string | undefined;
    let extra: Record<string, any> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody: unknown = exception.getResponse();
      if (typeof resBody === 'string') {
        message = resBody;
        errorName = exception.name;
      } else if (resBody && typeof resBody === 'object') {
        // Nest default structure often: { statusCode, message, error }
        const obj = resBody as Record<string, unknown>;
        message = (obj.message as string | undefined) ?? exception.message;
        errorName = (obj.error as string | undefined) ?? exception.name;
        extra = { ...obj } as Record<string, any>;
      } else {
        message = exception.message;
        errorName = exception.name;
      }
    } else if (exception && typeof exception === 'object') {
      // Non-HTTP exception
      const errObj = exception as { message?: string; name?: string };
      message = errObj.message ?? 'Internal server error';
      errorName = errObj.name ?? 'Error';
    } else {
      message = 'Internal server error';
      errorName = 'Error';
    }

    // Remove fields that we will provide ourselves to avoid duplication
    if (extra) {
      delete (extra as Record<string, unknown>).statusCode;
      delete (extra as Record<string, unknown>).timestamp;
      delete (extra as Record<string, unknown>).path;
    }

    const body = {
      success: false,
      message: Array.isArray(message) ? message.join(', ') : message || '',
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request?.url || '',
      statusCode: status,
      // Preserve any custom metadata from thrown exceptions (e.g. requiresVerification, userId, email)
      ...extra,
    };

    response.status(status).json(body);
  }
}
