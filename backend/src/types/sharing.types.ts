/**
 * Sharing Types for UnFranchise Marketing App
 */

export interface ShareEvent {
  ShareEventID: number;
  ShareGUID: string;
  UserID: number;
  ContentItemID: number;
  CampaignID?: number;
  ShareChannel: 'SMS' | 'Email' | 'Social';
  SocialPlatform?: string;
  PersonalMessage?: string;
  ShareTemplate?: string;
  TrackingCode: string;
  Status: 'Sent' | 'Delivered' | 'Failed' | 'Bounced';
  FailureReason?: string;
  RecipientCount: number;
  ClickCount: number;
  UniqueClickCount: number;
  ViewCount: number;
  ShareDate: Date;
  UserAgent?: string;
  IPAddress?: string;
  DeviceType?: string;
  CreatedDate: Date;
}

export interface ShareRecipient {
  ShareRecipientID: number;
  ShareEventID: number;
  ContactID?: number;
  RecipientEmail?: string;
  RecipientMobile?: string;
  RecipientName?: string;
  DeliveryStatus: 'Pending' | 'Sent' | 'Delivered' | 'Failed' | 'Bounced';
  DeliveryDate?: Date;
  BounceReason?: string;
  CreatedDate: Date;
}

export interface TrackingLink {
  TrackingLinkID: number;
  ShareEventID: number;
  ShortCode: string;
  FullTrackingURL: string;
  DestinationURL: string;
  LinkType: string;
  ClickCount: number;
  UniqueClickCount: number;
  FirstClickDate?: Date;
  LastClickDate?: Date;
  IsActive: boolean;
  ExpirationDate?: Date;
  CreatedDate: Date;
}

export interface EngagementEvent {
  EngagementEventID: number;
  ContentItemID: number;
  TrackingLinkID: number;
  ShareEventID?: number;
  ContactID?: number;
  EventType: string;
  EventValue?: string;
  EventDate: Date;
  IPAddress?: string;
  UserAgent?: string;
  DeviceType?: string;
  OperatingSystem?: string;
  Browser?: string;
  Country?: string;
  City?: string;
  SessionID?: string;
  IsUniqueVisitor: boolean;
  ReferrerURL?: string;
  CreatedDate: Date;
}

export interface CreateShareRequest {
  contentItemId: number;
  channel: 'SMS' | 'Email' | 'Social';
  socialPlatform?: string;
  personalMessage?: string;
  recipients?: ShareRecipientInput[];
  campaignId?: number;
  templateName?: string;
}

export interface ShareRecipientInput {
  contactId?: number;
  email?: string;
  mobile?: string;
  name?: string;
}

export interface TrackingLinkRequest {
  contentItemId: number;
  userId: number;
  channel: 'SMS' | 'Email' | 'Social';
  destinationUrl: string;
}

export interface ClickTrackingRequest {
  trackingCode: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

export interface ShareAnalyticsFilters {
  userId?: number;
  contentId?: number;
  channel?: 'SMS' | 'Email' | 'Social';
  startDate?: Date | string;
  endDate?: Date | string;
  campaignId?: number;
}

export interface ShareAnalyticsResponse {
  success: boolean;
  data: {
    totalShares: number;
    totalClicks: number;
    totalUniqueClicks: number;
    averageClickRate: number;
    sharesByChannel: {
      channel: string;
      count: number;
      clicks: number;
      clickRate: number;
    }[];
    topContent: {
      contentItemId: number;
      title: string;
      shares: number;
      clicks: number;
      clickRate: number;
    }[];
    recentShares: ShareEvent[];
    timeline?: {
      date: string;
      shares: number;
      clicks: number;
    }[];
  };
}

export interface ShareTemplate {
  channel: 'SMS' | 'Email' | 'Social';
  socialPlatform?: string;
  templateName: string;
  subject?: string;
  body: string;
  variables: string[];
  maxLength?: number;
}

export interface CreateShareResponse {
  success: boolean;
  data: {
    shareEventId: number;
    trackingCode: string;
    trackingUrl: string;
    shareEvent: ShareEvent;
  };
  message?: string;
}

export interface TrackingRedirectResponse {
  success: boolean;
  redirectUrl: string;
  recorded: boolean;
}
