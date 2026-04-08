/**
 * Admin Dashboard Controller
 * Handles admin dashboard endpoints for system monitoring and analytics
 */

import { Request, Response } from 'express';
import { AdminDashboardService } from '../services/admin-dashboard.service.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('AdminDashboardController');
const adminDashboardService = new AdminDashboardService();

/**
 * GET /api/v1/admin/dashboard/metrics
 * Get overall system metrics
 */
export async function getSystemMetrics(req: Request, res: Response): Promise<void> {
  try {
    logger.info(`Admin ${req.user?.userId} requested system metrics`);

    const metrics = await adminDashboardService.getSystemMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/v1/admin/dashboard/activity
 * Get recent activity across all users (paginated)
 */
export async function getRecentActivity(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    logger.info(`Admin ${req.user?.userId} requested recent activity (limit: ${limit}, offset: ${offset})`);

    const activities = await adminDashboardService.getRecentActivity(limit, offset);

    res.json({
      success: true,
      data: activities,
      pagination: {
        limit,
        offset,
        total: activities.length
      }
    });
  } catch (error) {
    logger.error('Error getting recent activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent activity',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/v1/admin/dashboard/health
 * Get system health status
 */
export async function getSystemHealth(req: Request, res: Response): Promise<void> {
  try {
    logger.info(`Admin ${req.user?.userId} requested system health check`);

    const health = await adminDashboardService.getSystemHealth();

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error getting system health:', error);
    res.status(503).json({
      success: false,
      error: 'Failed to get system health',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/v1/admin/dashboard/growth/users
 * Get user growth trends
 */
export async function getUserGrowth(req: Request, res: Response): Promise<void> {
  try {
    const days = parseInt(req.query.days as string) || 30;

    logger.info(`Admin ${req.user?.userId} requested user growth data (${days} days)`);

    const growth = await adminDashboardService.getUserGrowth(days);

    res.json({
      success: true,
      data: growth
    });
  } catch (error) {
    logger.error('Error getting user growth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user growth data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/v1/admin/dashboard/growth/content
 * Get content growth trends
 */
export async function getContentGrowth(req: Request, res: Response): Promise<void> {
  try {
    const days = parseInt(req.query.days as string) || 30;

    logger.info(`Admin ${req.user?.userId} requested content growth data (${days} days)`);

    const growth = await adminDashboardService.getContentGrowth(days);

    res.json({
      success: true,
      data: growth
    });
  } catch (error) {
    logger.error('Error getting content growth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get content growth data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/v1/admin/dashboard/growth/shares
 * Get share activity trends
 */
export async function getShareTrends(req: Request, res: Response): Promise<void> {
  try {
    const days = parseInt(req.query.days as string) || 30;

    logger.info(`Admin ${req.user?.userId} requested share trends data (${days} days)`);

    const trends = await adminDashboardService.getShareTrends(days);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Error getting share trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get share trends data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/v1/admin/dashboard/engagement
 * Get overall engagement metrics
 */
export async function getEngagementMetrics(req: Request, res: Response): Promise<void> {
  try {
    logger.info(`Admin ${req.user?.userId} requested engagement metrics`);

    const metrics = await adminDashboardService.getEngagementMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting engagement metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get engagement metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
