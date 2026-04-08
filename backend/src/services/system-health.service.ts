/**
 * System Health Service
 * Monitors system health metrics including database, server, and API performance
 */

import os from 'os';
import { getPool } from '../config/database.js';
import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SystemHealthService');

export class SystemHealthService {
  /**
   * Check database health and connection performance
   */
  async checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    connectionCount: number;
  }> {
    try {
      const startTime = Date.now();

      // Test database connection with a simple query
      await getPool();
      const result = await query<any>(`
        SELECT
          COUNT(*) as ConnectionCount
        FROM sys.dm_exec_sessions
        WHERE is_user_process = 1
      `);

      const responseTime = Date.now() - startTime;
      const connectionCount = result[0]?.ConnectionCount || 0;

      // Determine status based on response time
      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (responseTime > 1000) {
        status = 'degraded';
      } else if (responseTime > 5000) {
        status = 'down';
      }

      return {
        status,
        responseTime,
        connectionCount
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'down',
        responseTime: -1,
        connectionCount: 0
      };
    }
  }

  /**
   * Get Node.js memory usage statistics
   */
  getMemoryUsage(): {
    total: number;
    used: number;
    percentage: number;
  } {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const percentage = (usedMemory / totalMemory) * 100;

    return {
      total: totalMemory,
      used: usedMemory,
      percentage: parseFloat(percentage.toFixed(2))
    };
  }

  /**
   * Get CPU usage (simplified - based on load average)
   */
  getCPUUsage(): number {
    const cpus = os.cpus();
    const loadAverage = os.loadavg()[0]; // 1-minute load average
    const cpuCount = cpus.length;

    // Calculate CPU usage percentage (load average / CPU count * 100)
    const cpuUsage = (loadAverage / cpuCount) * 100;

    return parseFloat(Math.min(cpuUsage, 100).toFixed(2));
  }

  /**
   * Get active users in the last N hours
   */
  async getActiveUsers(hours: number = 24): Promise<number> {
    try {
      const result = await query<any>(`
        SELECT COUNT(DISTINCT UserID) as ActiveUsers
        FROM dbo.UserSession
        WHERE LastActivityDate >= DATEADD(HOUR, -@hours, SYSDATETIME())
          AND ExpiresAt > SYSDATETIME()
      `, { hours });

      return result[0]?.ActiveUsers || 0;
    } catch (error) {
      logger.error('Error getting active users:', error);
      return 0;
    }
  }

  /**
   * Get average API response times (simplified - would need actual tracking)
   */
  async getAPIResponseTimes(): Promise<number> {
    // In a production system, this would query from an API request log table
    // For now, we'll return a placeholder value
    // TODO: Implement actual API response time tracking
    return 150; // milliseconds (placeholder)
  }

  /**
   * Get overall system health status
   */
  async getSystemHealth(): Promise<{
    database: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number;
    };
    api: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number;
    };
    memory: {
      percentage: number;
    };
    activeUsers: number;
  }> {
    try {
      // Get database health
      const dbHealth = await this.checkDatabaseHealth();

      // Get server metrics
      const memoryUsage = this.getMemoryUsage();

      // Get API metrics
      const avgResponseTime = await this.getAPIResponseTimes();

      // Determine API status based on response time
      let apiStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (avgResponseTime > 500) {
        apiStatus = 'degraded';
      } else if (avgResponseTime > 2000) {
        apiStatus = 'down';
      }

      // Get active users
      const activeUsers = await this.getActiveUsers(24);

      return {
        database: {
          status: dbHealth.status,
          responseTime: dbHealth.responseTime
        },
        api: {
          status: apiStatus,
          responseTime: avgResponseTime
        },
        memory: {
          percentage: memoryUsage.percentage
        },
        activeUsers
      };
    } catch (error) {
      logger.error('Error getting system health:', error);
      throw error;
    }
  }
}
