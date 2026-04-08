/**
 * Content Types for UnFranchise Marketing App
 */

export interface ContentItem {
  ContentItemID: number;
  ContentGUID: string;
  Title: string;
  Subtitle?: string;
  Description?: string;
  ThumbnailURL?: string;
  MediaURL?: string;
  DestinationURL?: string;
  ContentType: string;
  MIMEType?: string;
  FileSizeBytes?: number;
  DurationSeconds?: number;
  ExternalContentID?: string;
  PublishStatus: 'Draft' | 'Review' | 'Approved' | 'Published' | 'Archived';
  PublishDate?: Date;
  ExpirationDate?: Date;
  AllowSMS: boolean;
  AllowEmail: boolean;
  AllowSocial: boolean;
  AllowPersonalNote: boolean;
  CTAType?: string;
  CTALabel?: string;
  RequiresDisclaimer: boolean;
  DisclaimerText?: string;
  IsRegulatedContent: boolean;
  ViewCount: number;
  ShareCount: number;
  ClickCount: number;
  IsFeatured: boolean;
  FeaturedPriority: number;
  CreatedDate: Date;
  CreatedBy?: number;
  UpdatedDate: Date;
  UpdatedBy?: number;
}

export interface ContentItemWithRelations extends ContentItem {
  CategoryName?: string;
  CategoryID?: number;
  Tags?: string[] | string;
  Markets?: string[] | string;
  Languages?: string[] | string;
  CampaignName?: string;
  CampaignID?: number;
}

export interface ContentCategory {
  ContentCategoryID: number;
  CategoryName: string;
  CategoryDescription?: string;
  ParentCategoryID?: number;
  CategoryPath?: string;
  SortOrder: number;
  IconURL?: string;
  IsActive: boolean;
  CreatedDate: Date;
  UpdatedDate: Date;
}

export interface ContentTag {
  ContentTagID: number;
  TagName: string;
  TagDescription?: string;
  TagColor?: string;
  IsActive: boolean;
  CreatedDate: Date;
}

export interface ContentFilters {
  search?: string;
  category?: number;
  market?: string;
  language?: string;
  contentType?: string;
  publishStatus?: string;
  isFeatured?: boolean;
  tags?: string[];
  campaignId?: number;
  limit?: number;
  offset?: number;
}

export interface CreateContentRequest {
  title: string;
  subtitle?: string;
  description?: string;
  thumbnailURL?: string;
  mediaURL?: string;
  destinationURL?: string;
  contentType: string;
  mimeType?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  externalContentID?: string;
  publishStatus?: 'Draft' | 'Review' | 'Approved' | 'Published' | 'Archived';
  publishDate?: Date;
  expirationDate?: Date;
  allowSMS?: boolean;
  allowEmail?: boolean;
  allowSocial?: boolean;
  allowPersonalNote?: boolean;
  ctaType?: string;
  ctaLabel?: string;
  requiresDisclaimer?: boolean;
  disclaimerText?: string;
  isRegulatedContent?: boolean;
  isFeatured?: boolean;
  featuredPriority?: number;
  categoryIds?: number[];
  tagIds?: number[];
  marketIds?: number[];
  languageIds?: number[];
  campaignIds?: number[];
}

export interface UpdateContentRequest extends Partial<CreateContentRequest> {
  contentItemId: number;
}

export interface ContentListResponse {
  success: boolean;
  data: {
    items: ContentItemWithRelations[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ContentDetailResponse {
  success: boolean;
  data: {
    content: ContentItemWithRelations;
    relatedContent?: ContentItemWithRelations[];
  };
}

export interface ContentCategoryResponse {
  success: boolean;
  data: {
    categories: ContentCategory[];
  };
}
