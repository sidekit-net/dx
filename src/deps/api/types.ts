// NuGet API v3 types

export interface NuGetServiceIndex {
  version: string;
  resources: NuGetResource[];
}

export interface NuGetResource {
  '@id': string;
  '@type': string;
  comment?: string;
}

export interface NuGetSearchResponse {
  totalHits: number;
  data: NuGetSearchResult[];
}

export interface NuGetSearchResult {
  '@id': string;
  '@type': string;
  registration: string;
  id: string;
  version: string;
  description: string;
  summary: string;
  title: string;
  iconUrl?: string;
  licenseUrl?: string;
  projectUrl?: string;
  tags: string[];
  authors: string[];
  owners: string[];
  totalDownloads: number;
  verified: boolean;
  packageTypes: { name: string }[];
  versions: NuGetVersionInfo[];
}

export interface NuGetVersionInfo {
  version: string;
  downloads: number;
  '@id': string;
}

export interface NuGetRegistrationIndex {
  '@id': string;
  '@type': string[];
  catalogEntry: NuGetCatalogEntry;
  listed: boolean;
  packageContent: string;
  published: string;
}

export interface NuGetCatalogEntry {
  '@id': string;
  id: string;
  version: string;
  description: string;
  authors: string;
  dependencyGroups?: NuGetDependencyGroup[];
}

export interface NuGetDependencyGroup {
  targetFramework?: string;
  dependencies?: NuGetDependency[];
}

export interface NuGetDependency {
  id: string;
  range: string;
}

export interface NuGetRegistrationPage {
  '@id': string;
  count: number;
  items: NuGetRegistrationIndex[];
  lower: string;
  upper: string;
}

export interface NuGetRegistrationResponse {
  '@id': string;
  count: number;
  items: NuGetRegistrationPage[];
}
