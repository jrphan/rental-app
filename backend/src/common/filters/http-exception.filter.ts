import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ExceptionInfo {
  status: number;
  message: string;
  errorName: string;
  extra: Record<string, any>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const exceptionInfo = this.extractExceptionInfo(exception);
    const cleanedExtra = this.cleanExtraFields(exceptionInfo.extra);
    const errorResponse = this.formatErrorResponse(
      exceptionInfo,
      cleanedExtra,
      request.url,
    );

    response.status(exceptionInfo.status).json(errorResponse);
  }

  /**
   * Extract exception information from various exception types
   */
  private extractExceptionInfo(exception: unknown): ExceptionInfo {
    if (exception instanceof HttpException) {
      return this.extractHttpExceptionInfo(exception);
    }

    if (exception && typeof exception === 'object') {
      return this.extractGenericExceptionInfo(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      errorName: 'Error',
      extra: {},
    };
  }

  /**
   * Extract info from HttpException (NestJS standard exceptions)
   */
  private extractHttpExceptionInfo(exception: HttpException): ExceptionInfo {
    const status = exception.getStatus();
    const resBody: unknown = exception.getResponse();

    // Case 1: Response body is a string
    if (typeof resBody === 'string') {
      return {
        status,
        message: resBody,
        errorName: exception.name,
        extra: {},
      };
    }

    // Case 2: Response body is an object (NestJS default: { statusCode, message, error })
    if (resBody && typeof resBody === 'object') {
      const obj = resBody as Record<string, unknown>;
      return {
        status,
        message: (obj.message as string | undefined) ?? exception.message,
        errorName: (obj.error as string | undefined) ?? exception.name,
        extra: { ...obj } as Record<string, any>,
      };
    }

    // Case 3: Fallback to exception message
    return {
      status,
      message: exception.message,
      errorName: exception.name,
      extra: {},
    };
  }

  /**
   * Extract info from generic exceptions (non-HTTP)
   */
  private extractGenericExceptionInfo(exception: object): ExceptionInfo {
    const errObj = exception as { message?: string; name?: string };
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: errObj.message ?? 'Internal server error',
      errorName: errObj.name ?? 'Error',
      extra: {},
    };
  }

  /**
   * Remove fields that will be provided by formatErrorResponse to avoid duplication
   */
  private cleanExtraFields(extra: Record<string, any>): Record<string, any> {
    const cleaned = { ...extra };
    delete cleaned.statusCode;
    delete cleaned.timestamp;
    delete cleaned.path;
    return cleaned;
  }

  /**
   * Format error response according to ApiResponse standard
   * Mobile and Web expect: { success: false, message, error, timestamp, path, statusCode, ...extra }
   */
  private formatErrorResponse(
    exceptionInfo: ExceptionInfo,
    extra: Record<string, any>,
    requestPath: string,
  ) {
    const message = Array.isArray(exceptionInfo.message)
      ? exceptionInfo.message.join(', ')
      : exceptionInfo.message || '';

    return {
      success: false,
      message,
      error: exceptionInfo.errorName,
      timestamp: new Date().toISOString(),
      path: requestPath || '',
      statusCode: exceptionInfo.status,
      // Preserve any custom metadata from thrown exceptions
      // (e.g. requiresVerification, userId, email)
      ...extra,
    };
  }
}
