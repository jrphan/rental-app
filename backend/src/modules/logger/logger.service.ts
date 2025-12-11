import { Injectable, Logger } from '@nestjs/common';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export enum LOG_CATEGORY {
  SMS = 'sms',
  AUTH = 'auth',
  PAYMENT = 'payment',
  GENERAL = 'general',
  ERROR = 'error',
}

export interface LogOptions {
  category?: LOG_CATEGORY;
  includeTimestamp?: boolean;
  format?: 'text' | 'json';
}

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);
  private readonly logsBasePath: string;

  constructor() {
    this.logsBasePath = join(process.cwd(), 'logs');
    void this.ensureLogDirectory();
  }

  /**
   * Đảm bảo thư mục logs tồn tại
   */
  private async ensureLogDirectory(): Promise<void> {
    if (!existsSync(this.logsBasePath)) {
      try {
        await mkdir(this.logsBasePath, { recursive: true });
        this.logger.debug(`Created logs directory: ${this.logsBasePath}`);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        this.logger.warn(`Cannot create logs directory: ${errorMessage}`);
      }
    }
  }

  /**
   * Lấy đường dẫn thư mục log cho category
   */
  private getCategoryLogPath(category: LOG_CATEGORY): string {
    return join(this.logsBasePath, category);
  }

  /**
   * Đảm bảo thư mục log cho category tồn tại
   */
  private async ensureCategoryDirectory(category: LOG_CATEGORY): Promise<void> {
    const categoryPath = this.getCategoryLogPath(category);
    if (!existsSync(categoryPath)) {
      try {
        await mkdir(categoryPath, { recursive: true });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        this.logger.warn(
          `Cannot create log directory for category ${category}: ${errorMessage}`,
        );
      }
    }
  }

  /**
   * Tạo tên file log theo ngày
   */
  private getLogFileName(category: LOG_CATEGORY): string {
    const date = new Date().toISOString().split('T')[0];
    return `${category}-${date}.log`;
  }

  /**
   * Format log message
   */
  private formatLogMessage(
    message: string,
    data?: Record<string, unknown>,
    options?: LogOptions,
  ): string {
    const timestamp = new Date().toISOString();
    const includeTimestamp = options?.includeTimestamp !== false;

    if (options?.format === 'json') {
      return JSON.stringify(
        {
          timestamp: includeTimestamp ? timestamp : undefined,
          message,
          ...data,
        },
        null,
        2,
      );
    }

    // Format text
    let formatted = '';
    if (includeTimestamp) {
      formatted += `[${timestamp}] `;
    }
    formatted += message;

    if (data && Object.keys(data).length > 0) {
      formatted += '\n' + JSON.stringify(data, null, 2);
    }

    return formatted;
  }

  /**
   * Ghi log vào file
   */
  private async writeToFile(
    category: LOG_CATEGORY,
    content: string,
  ): Promise<void> {
    try {
      await this.ensureCategoryDirectory(category);
      const logFileName = this.getLogFileName(category);
      const logFilePath = join(this.getCategoryLogPath(category), logFileName);
      await writeFile(logFilePath, content + '\n', { flag: 'a' });
    } catch (err: unknown) {
      // Không throw error để không làm gián đoạn flow chính
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(
        `Cannot write log file for category ${category}: ${errorMessage}`,
      );
    }
  }

  /**
   * Ghi log thông thường
   */
  async log(
    message: string,
    data?: Record<string, unknown>,
    options?: LogOptions,
  ): Promise<void> {
    const category = options?.category || LOG_CATEGORY.GENERAL;
    const formattedMessage = this.formatLogMessage(message, data, options);

    // Log to console
    this.logger.log(formattedMessage);

    // Log to file
    await this.writeToFile(category, formattedMessage);
  }

  /**
   * Ghi log lỗi
   */
  async error(
    message: string,
    error?: unknown,
    options?: LogOptions,
  ): Promise<void> {
    const category = options?.category || LOG_CATEGORY.ERROR;
    const errorData: Record<string, unknown> = {};

    if (error instanceof Error) {
      errorData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (error) {
      errorData.error = error;
    }

    const formattedMessage = this.formatLogMessage(message, errorData, options);

    // Log to console
    this.logger.error(formattedMessage);

    // Log to file
    await this.writeToFile(category, formattedMessage);
  }

  /**
   * Ghi log cảnh báo
   */
  async warn(
    message: string,
    data?: Record<string, unknown>,
    options?: LogOptions,
  ): Promise<void> {
    const category = options?.category || LOG_CATEGORY.GENERAL;
    const formattedMessage = this.formatLogMessage(message, data, options);

    // Log to console
    this.logger.warn(formattedMessage);

    // Log to file
    await this.writeToFile(category, formattedMessage);
  }

  /**
   * Ghi log debug
   */
  async debug(
    message: string,
    data?: Record<string, unknown>,
    options?: LogOptions,
  ): Promise<void> {
    const category = options?.category || LOG_CATEGORY.GENERAL;
    const formattedMessage = this.formatLogMessage(message, data, options);

    // Log to console
    this.logger.debug(formattedMessage);

    // Log to file
    await this.writeToFile(category, formattedMessage);
  }

  /**
   * Ghi log với format tùy chỉnh (ví dụ: SMS OTP)
   */
  async logFormatted(
    title: string,
    content: Record<string, unknown>,
    options?: LogOptions,
  ): Promise<void> {
    const category = options?.category || LOG_CATEGORY.GENERAL;
    const timestamp = new Date().toISOString();

    const separator = '═══════════════════════════════════════';
    let formattedMessage = `\n${separator}\n`;
    formattedMessage += `${title}\n`;
    formattedMessage += `${separator}\n`;

    for (const [key, value] of Object.entries(content)) {
      let valueStr: string;
      if (value === null) {
        valueStr = 'null';
      } else if (value === undefined) {
        valueStr = 'undefined';
      } else if (typeof value === 'string') {
        valueStr = value;
      } else if (typeof value === 'object') {
        valueStr = JSON.stringify(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        valueStr = String(value);
      } else {
        valueStr = JSON.stringify(value);
      }
      formattedMessage += `${key}: ${valueStr}\n`;
    }

    formattedMessage += `Time: ${timestamp}\n`;
    formattedMessage += `${separator}\n`;

    // Log to console
    this.logger.log(formattedMessage);

    // Log to file
    await this.writeToFile(category, formattedMessage);
  }
}
