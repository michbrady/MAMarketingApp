/**
 * Admin Dashboard Types
 */

export interface SystemMetrics {
  users: {
    total: number;
    byRole: { [role: string]: number };
    activeToday: number;
    newThisWeek: number;
  };
  content: {
    total: number;
    byCategory: { [category: string]: number };
    byStatus: { [status: string]: number };
    addedThisWeek: number;
  };
  shares: {
    total: number;
    byChannel: { [channel: string]: number };
    todayCount: number;
    weeklyCount: number;
  };
  contacts: {
    total: number;
    byStatus: { [status: string]: number };
    addedThisWeek: number;
  };
  followUps: {
    pending: number;
    overdue: number;
    completedToday: number;
    completedThisWeek: number;
  };
  engagement: {
    averageSharesPerUser: number;
    averageEngagementRate: number;
    totalClicks: number;
    clickThroughRate: number;
  };
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    connectionCount: number;
  };
  server: {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    memoryUsage: {
      total: number;
      used: number;
      percentage: number;
    };
    cpuUsage: number;
  };
  api: {
    averageResponseTime: number;
    errorRate: number;
  };
}

export interface ActivityEvent {
  eventId: string;
  eventType: 'share' | 'content_added' | 'user_registered' | 'followup_completed';
  userId: number;
  userName: string;
  timestamp: Date;
  description: string;
  metadata?: any;
}

export interface GrowthData {
  labels: string[];
  values: number[];
  total: number;
  change: number; // percentage change from previous period
}

export interface EngagementMetrics {
  averageSharesPerUser: number;
  averageEngagementRate: number;
  topPerformingContent: TopContent[];
  topPerformingUsers: TopUser[];
}

export interface TopContent {
  contentItemId: number;
  title: string;
  contentType: string;
  totalShares: number;
  totalClicks: number;
  engagementRate: number;
}

export interface TopUser {
  userId: number;
  name: string;
  email: string;
  totalShares: number;
  totalClicks: number;
  engagementRate: number;
}
