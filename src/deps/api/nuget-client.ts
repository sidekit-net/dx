import type {
  NuGetServiceIndex,
  NuGetSearchResponse,
  NuGetSearchResult,
  NuGetRegistrationResponse,
} from './types.js';
import type { NuGetPackage, PackageVersion } from '../types/index.js';

const SERVICE_INDEX_URL = 'https://api.nuget.org/v3/index.json';

let cachedServiceIndex: NuGetServiceIndex | null = null;
let cachedSearchUrl: string | null = null;
let cachedRegistrationUrl: string | null = null;

/**
 * Fetch the NuGet service index and cache resource URLs
 */
async function getServiceIndex(): Promise<NuGetServiceIndex> {
  if (cachedServiceIndex) {
    return cachedServiceIndex;
  }

  const response = await fetch(SERVICE_INDEX_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch service index: ${response.statusText}`);
  }

  cachedServiceIndex = (await response.json()) as NuGetServiceIndex;
  return cachedServiceIndex;
}

/**
 * Get the search endpoint URL from the service index
 */
async function getSearchUrl(): Promise<string> {
  if (cachedSearchUrl) {
    return cachedSearchUrl;
  }

  const index = await getServiceIndex();
  const searchResource = index.resources.find(
    (r) => r['@type'] === 'SearchQueryService' || r['@type'].includes('SearchQueryService')
  );

  if (!searchResource) {
    throw new Error('Search service not found in NuGet index');
  }

  cachedSearchUrl = searchResource['@id'];
  return cachedSearchUrl;
}

/**
 * Get the registration endpoint URL from the service index
 */
async function getRegistrationUrl(): Promise<string> {
  if (cachedRegistrationUrl) {
    return cachedRegistrationUrl;
  }

  const index = await getServiceIndex();
  const regResource = index.resources.find(
    (r) =>
      r['@type'] === 'RegistrationsBaseUrl/3.6.0' ||
      r['@type'] === 'RegistrationsBaseUrl' ||
      r['@type'].includes('RegistrationsBaseUrl')
  );

  if (!regResource) {
    throw new Error('Registration service not found in NuGet index');
  }

  cachedRegistrationUrl = regResource['@id'];
  return cachedRegistrationUrl;
}

/**
 * Search for packages on NuGet
 */
export async function searchPackages(
  query: string,
  options: {
    skip?: number;
    take?: number;
    prerelease?: boolean;
  } = {}
): Promise<NuGetPackage[]> {
  const { skip = 0, take = 20, prerelease = true } = options;

  const searchUrl = await getSearchUrl();
  const params = new URLSearchParams({
    q: query,
    skip: skip.toString(),
    take: take.toString(),
    prerelease: prerelease.toString(),
    semVerLevel: '2.0.0',
  });

  const response = await fetch(`${searchUrl}?${params}`);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const data = (await response.json()) as NuGetSearchResponse;
  return data.data.map(mapSearchResultToPackage);
}

/**
 * Get all versions for a package
 */
export async function getPackageVersions(packageId: string): Promise<PackageVersion[]> {
  const registrationUrl = await getRegistrationUrl();
  const url = `${registrationUrl}${packageId.toLowerCase()}/index.json`;

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to fetch versions: ${response.statusText}`);
  }

  const data = (await response.json()) as NuGetRegistrationResponse;
  const versions: PackageVersion[] = [];

  for (const page of data.items) {
    // Some pages might not have items inline and require fetching
    const items = page.items ?? [];
    for (const item of items) {
      versions.push({
        version: item.catalogEntry.version,
        downloads: 0, // Not always available in registration
        isPrerelease: isPrerelease(item.catalogEntry.version),
      });
    }
  }

  // Sort versions descending (newest first)
  versions.sort((a, b) => compareVersions(b.version, a.version));

  return versions;
}

/**
 * Get the latest version of a package
 */
export async function getLatestVersion(
  packageId: string,
  includePrerelease = false
): Promise<string | null> {
  const versions = await getPackageVersions(packageId);

  const filtered = includePrerelease
    ? versions
    : versions.filter((v) => !v.isPrerelease);

  return filtered[0]?.version ?? null;
}

/**
 * Map NuGet API search result to our package type
 */
function mapSearchResultToPackage(result: NuGetSearchResult): NuGetPackage {
  return {
    id: result.id,
    version: result.version,
    description: result.description || result.summary || '',
    authors: result.authors || [],
    totalDownloads: result.totalDownloads,
    verified: result.verified,
    versions: result.versions.map((v) => ({
      version: v.version,
      downloads: v.downloads,
      isPrerelease: isPrerelease(v.version),
    })),
  };
}

/**
 * Check if a version string indicates a prerelease
 */
function isPrerelease(version: string): boolean {
  return /[-]/.test(version);
}

/**
 * Compare two semantic version strings
 * Returns positive if a > b, negative if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  // Remove prerelease suffix for comparison
  const aCore = a.split('-')[0]!;
  const bCore = b.split('-')[0]!;

  const aParts = aCore.split('.').map(Number);
  const bParts = bCore.split('.').map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] ?? 0;
    const bPart = bParts[i] ?? 0;

    if (aPart !== bPart) {
      return aPart - bPart;
    }
  }

  // If core versions are equal, stable > prerelease
  const aIsPrerelease = isPrerelease(a);
  const bIsPrerelease = isPrerelease(b);

  if (aIsPrerelease && !bIsPrerelease) return -1;
  if (!aIsPrerelease && bIsPrerelease) return 1;

  return 0;
}
