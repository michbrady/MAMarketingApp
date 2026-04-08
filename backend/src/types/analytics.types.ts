/**
 * Analytics Types for UnFranchise Marketing App
 */

export interface ShareAnalyticsFilters {
  userId?: number;
  contentId?: number;
  campaignId?: number;
  channel?: string;
  marketCode?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface SharePerformanceMetrics {
  totalShares: number;
  totalClicks: number;
  uniqueClicks: number;
  totalRecipients: number;
  clickThroughRate: number;
  averageClicksPerShare: number;
  topChannel: string;
  topChannelShares: number;
}

export interface ShareTrendDataPoint {
  date: string;
  shares: number;
  clicks: number;
  uniqueClicks: number;
  recipients: number;
}

export interface ChannelPerformance {
  channel: string;
  totalShares: number;
  totalClicks: number;
  uniqueClicks: number;
  clickThroughRate: number;
  averageClicksPerShare: number;
}

export interface TopContentItem {
  contentItemId: number;
  title: string;
  contentType: string;
  totalShares: number;
  uniqueSharers: number;
  totalClicks: number;
  clickThroughRate: number;
  lastSharedDate: Date;
}

export interface TopSharer {
  userId: number;
  memberID: string;
  name: string;
  email: string;
  totalShares: number;
  totalClicks: number;
  uniqueContent: number;
  averageClicksPerShare: number;
  lastShareDate: Date;
}

export interface EngagementEventCreate {
  trackingLinkId: number;
  contentItemId: number;
  shareEventId?: number;
  contactId?: number;
  eventType: 'Click' | 'View' | 'VideoStart' | 'VideoComplete' | 'EmailOpen' | 'Download';
  eventValue?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  operatingSystem?: string;
  browser?: string;
  referrerURL?: string;
  sessionId?: string;
  isUniqueVisitor?: boolean;
}

export interface ShareEventDetail {
  shareEventId: number;
  shareGuid: string;
  shareDate: Date;
  shareChannel: string;
  socialPlatform?: string;
  userId: number;
  memberID: string;
  sharerName: string;
  sharerEmail: string;
  marketCode: string;
  contentItemId: number;
  contentTitle: string;
  contentType: string;
  trackingCode: string;
  recipientCount: number;
  clickCount: number;
  uniqueClickCount: number;
  status: string;
}

export interface AnalyticsOverviewResponse {
  success: boolean;
  data: SharePerformanceMetrics;
}

export interface AnalyticsTrendsResponse {
  success: boolean;
  data: ShareTrendDataPoint[];
}

export interface ChannelPerformanceResponse {
  success: boolean;
  data: ChannelPerformance[];
}

export interface TopContentResponse {
  success: boolean;
  data: TopContentItem[];
}

export interface TopSharersResponse {
  success: boolean;
  data: TopSharer[];
}

export interface RecentSharesResponse {
  success: boolean;
  data: ShareEventDetail[];
}
