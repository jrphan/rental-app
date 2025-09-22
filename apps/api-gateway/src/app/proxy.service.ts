import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  // Microservices configuration
  private readonly services = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3333',
    vehicle: process.env.VEHICLE_SERVICE_URL || 'http://localhost:3334',
    booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:3335',
  };

  constructor(private readonly httpService: HttpService) {}

  /**
   * Proxy request to Auth Service
   */
  proxyToAuthService(
    method: string,
    path: string,
    data?: any,
    headers?: any
  ): Observable<AxiosResponse> {
    const url = `${this.services.auth}${path}`;
    this.logger.log(`Proxying ${method.toUpperCase()} ${url}`);
    
    return this.httpService.request({
      method,
      url,
      data,
      headers,
    });
  }

  /**
   * Proxy request to Vehicle Service
   */
  proxyToVehicleService(
    method: string,
    path: string,
    data?: any,
    headers?: any
  ): Observable<AxiosResponse> {
    const url = `${this.services.vehicle}${path}`;
    this.logger.log(`Proxying ${method.toUpperCase()} ${url}`);
    
    return this.httpService.request({
      method,
      url,
      data,
      headers,
    });
  }

  /**
   * Proxy request to Booking Service
   */
  proxyToBookingService(
    method: string,
    path: string,
    data?: any,
    headers?: any
  ): Observable<AxiosResponse> {
    const url = `${this.services.booking}${path}`;
    this.logger.log(`Proxying ${method.toUpperCase()} ${url}`);
    
    return this.httpService.request({
      method,
      url,
      data,
      headers,
    });
  }

  /**
   * Health check all services
   */
  async healthCheck() {
    const results: Record<string, any> = {};
    
    for (const [serviceName, serviceUrl] of Object.entries(this.services)) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(`${serviceUrl}/api`)
        );
        
        results[serviceName] = {
          status: 'healthy',
          url: serviceUrl,
          responseTime: response?.headers['x-response-time'] || 'N/A',
        };
      } catch (error) {
        results[serviceName] = {
          status: 'unhealthy',
          url: serviceUrl,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
    
    return results;
  }
}
