/**
 * Template Types
 */

export interface ShareTemplate {
  ShareTemplateID: number;
  TemplateName: string;
  TemplateDescription?: string;
  ShareChannel: 'SMS' | 'Email' | 'Social';
  SocialPlatform?: 'Facebook' | 'Twitter' | 'LinkedIn' | 'Instagram' | 'WhatsApp' | 'WeChat';
  ContentType?: 'Product' | 'BusinessOpportunity' | 'Event' | 'General';
  SubjectTemplate?: string;
  MessageTemplate: string;
  HTMLTemplate?: string;
  IsDefault: boolean;
  IsActive: boolean;
  IsSystemTemplate: boolean;
  MaxCharacters?: number;
  UsageCount: number;
  TotalShares: number;
  TotalClicks: number;
  ClickThroughRate?: number;
  LastUsedDate?: Date;
  MarketID?: number;
  LanguageID?: number;
  CreatedDate: Date;
  CreatedBy?: number;
  UpdatedDate: Date;
  UpdatedBy?: number;
}

export interface CreateTemplateDTO {
  TemplateName: string;
  TemplateDescription?: string;
  ShareChannel: 'SMS' | 'Email' | 'Social';
  SocialPlatform?: 'Facebook' | 'Twitter' | 'LinkedIn' | 'Instagram' | 'WhatsApp' | 'WeChat';
  ContentType?: 'Product' | 'BusinessOpportunity' | 'Event' | 'General';
  SubjectTemplate?: string;
  MessageTemplate: string;
  HTMLTemplate?: string;
  IsDefault?: boolean;
  MaxCharacters?: number;
  MarketID?: number;
  LanguageID?: number;
}

export interface UpdateTemplateDTO {
  TemplateName?: string;
  TemplateDescription?: string;
  SubjectTemplate?: string;
  MessageTemplate?: string;
  HTMLTemplate?: string;
  IsDefault?: boolean;
  IsActive?: boolean;
  MaxCharacters?: number;
}

export interface TemplateVariables {
  firstName?: string;
  lastName?: string;
  contentTitle?: string;
  contentDescription?: string;
  trackingLink?: string;
  senderEmail?: string;
  senderFirstName?: string;
  senderLastName?: string;
  companyName?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  productPrice?: string;
  [key: string]: string | undefined;
}

export interface RenderTemplateResult {
  subject?: string;
  message: string;
  html?: string;
  characterCount: number;
  exceedsLimit: boolean;
  variables: string[];
}

export interface TemplatePreviewRequest {
  ShareTemplateID?: number;
  MessageTemplate?: string;
  SubjectTemplate?: string;
  HTMLTemplate?: string;
  Variables: TemplateVariables;
}

export interface TemplatePerformance {
  ShareTemplateID: number;
  TemplateName: string;
  ShareChannel: string;
  ContentType?: string;
  TotalShares: number;
  TotalClicks: number;
  ClickThroughRate: number;
  UsageCount: number;
  LastUsedDate?: Date;
}
