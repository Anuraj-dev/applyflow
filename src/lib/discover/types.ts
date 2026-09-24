export type DiscoverJob = {
  externalId: string;
  title: string;
  company: string;
  url: string;
  location: string;
  type: string;
  description: string;
  source: string;
  tags?: string[];
  publishedAt?: string;
};

export type DiscoverFilters = {
  keywords?: string;
  location?: string;
  remoteOnly?: boolean;
  internship?: boolean;
  category?: string;
  limit?: number;
};
