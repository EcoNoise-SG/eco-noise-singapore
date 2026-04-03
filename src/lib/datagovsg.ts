/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Data.gov.sg API Integration
 * Handles real-time data fetching from Singapore government APIs
 * 
 * API Key: v2:d1488f0f0fa51b569264e9e63a1d2886134bba3a0ecb9ce7c1247915802a9e0a:ZtxSKmb91aJga_3X3B1lwFXLZXLUvv64
 */

const API_KEY = "v2:d1488f0f0fa51b569264e9e63a1d2886134bba3a0ecb9ce7c1247915802a9e0a:ZtxSKmb91aJga_3X3B1lwFXLZXLUvv64";
const BASE_URL = "https://api-production.data.gov.sg/v2/public/api";
const REALTIME_BASE_URL = "https://api-open.data.gov.sg/v2/real-time/api";
const DATASTORE_BASE_URL = "https://data.gov.sg/api/action/datastore_search";
const OPEN_DATASET_BASE_URL = "https://api-open.data.gov.sg/v1/public/api/datasets";
const PLANNING_AREA_DATASET_ID = "d_2cc750190544007400b2cfd5d7f53209";
const ONEMAP_SEARCH_URL = "https://www.onemap.gov.sg/api/common/elastic/search";

async function fetchRealtimeEndpoint(endpoint: string, revalidate = 600) {
  try {
    const response = await fetch(`${REALTIME_BASE_URL}/${endpoint}`, {
      headers: {
        "x-api-key": API_KEY,
      },
      next: { revalidate },
    });

    if (!response.ok) throw new Error(`Realtime API error (${endpoint}): ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Realtime fetch failed for ${endpoint}:`, error);
    return null;
  }
}

async function fetchDatastoreDataset(
  datasetId: string,
  options?: {
    limit?: number;
    offset?: number;
    q?: string;
    revalidate?: number;
  },
) {
  try {
    const query = new URLSearchParams({
      resource_id: datasetId,
      limit: String(options?.limit ?? 100),
    });

    if (typeof options?.offset === "number") {
      query.set("offset", String(options.offset));
    }

    if (options?.q) {
      query.set("q", options.q);
    }

    const response = await fetch(`${DATASTORE_BASE_URL}?${query.toString()}`, {
      headers: {
        "x-api-key": API_KEY,
      },
      next: { revalidate: options?.revalidate ?? 86400 },
    });

    if (!response.ok) {
      throw new Error(`Datastore API error (${datasetId}): ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Datastore fetch failed for ${datasetId}:`, error);
    return null;
  }
}

async function fetchDatasetDownload(datasetId: string) {
  try {
    const response = await fetch(`${OPEN_DATASET_BASE_URL}/${datasetId}/poll-download`, {
      headers: {
        "x-api-key": API_KEY,
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Dataset download API error (${datasetId}): ${response.status}`);
    }

    const payload = await response.json();
    const downloadUrl = payload?.data?.url;
    if (!downloadUrl) {
      return null;
    }

    const finalUrl = typeof window !== "undefined" ? `/api/proxy?url=${encodeURIComponent(downloadUrl)}` : downloadUrl;
    const downloadResponse = await fetch(finalUrl, {
      next: { revalidate: 3600 },
    });

    if (!downloadResponse.ok) {
      throw new Error(`Dataset file fetch error (${datasetId}): ${downloadResponse.status}`);
    }

    const contentType = downloadResponse.headers.get("content-type") || "";
    if (contentType.includes("application/json") || contentType.includes("geo+json")) {
      return await downloadResponse.json();
    }

    return {
      rawText: await downloadResponse.text(),
    };
  } catch (error: any) {
    if (!String(error).includes("429")) {
      console.error(`Dataset download fetch failed for ${datasetId}:`, error);
    }
    return null;
  }
}

function averageValues(values: Array<number | null | undefined>) {
  const validValues = values.filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
  if (!validValues.length) return null;
  return Number((validValues.reduce((sum, value) => sum + value, 0) / validValues.length).toFixed(1));
}

// ==================== NEA: Environment Data ====================

/**
 * Fetch real-time weather data from NEA
 * Components: C1 (construction risk), C6 (heat stress), C7 (disease)
 */
export async function fetchNEAWeather() {
  try {
    const [temperature, humidity, rainfall, windSpeed, forecast] = await Promise.all([
      fetchRealtimeEndpoint("air-temperature"),
      fetchRealtimeEndpoint("relative-humidity"),
      fetchRealtimeEndpoint("rainfall"),
      fetchRealtimeEndpoint("wind-speed"),
      fetchRealtimeEndpoint("two-hr-forecast"),
    ]);

    const airTemperature = averageValues(
      temperature?.data?.readings?.[0]?.data?.map((entry: { value: number }) => Number(entry.value)) || [],
    );
    const relativeHumidity = averageValues(
      humidity?.data?.readings?.[0]?.data?.map((entry: { value: number }) => Number(entry.value)) || [],
    );
    const rainfallAmount = averageValues(
      rainfall?.data?.readings?.[0]?.data?.map((entry: { value: number }) => Number(entry.value)) || [],
    );
    const windSpeedAvg = averageValues(
      windSpeed?.data?.readings?.[0]?.data?.map((entry: { value: number }) => Number(entry.value)) || [],
    );
    const firstForecast = forecast?.data?.items?.[0]?.forecasts?.[0];

    return {
      records: [
        {
          air_temperature: airTemperature,
          relative_humidity: relativeHumidity,
          rainfall: rainfallAmount,
          wind_speed: windSpeedAvg,
          forecast: firstForecast?.forecast || "Unavailable",
          timestamp:
            forecast?.data?.items?.[0]?.timestamp ||
            temperature?.data?.readings?.[0]?.timestamp ||
            new Date().toISOString(),
        },
      ],
      raw: {
        temperature,
        humidity,
        rainfall,
        windSpeed,
        forecast,
      },
    };
  } catch (error) {
    console.error("NEA Weather fetch failed:", error);
    return null;
  }
}

/**
 * Fetch real-time air quality (PM2.5) from NEA
 * Components: C6 (heat), C7 (disease outbreak - respiratory risk)
 */
export async function fetchNEAAirQuality() {
  try {
    const data = await fetchRealtimeEndpoint("pm25");
    const pm25Readings = data?.data?.items?.[0]?.readings?.pm25_one_hourly || {};
    const regionalValues = Object.values(pm25Readings).map((value) => Number(value));

    return {
      records: [
        {
          pm25_one_hourly: averageValues(regionalValues),
          readings_by_region: pm25Readings,
          timestamp: data?.data?.items?.[0]?.timestamp || new Date().toISOString(),
        },
      ],
      raw: data,
    };
  } catch (error) {
    console.error("NEA Air Quality fetch failed:", error);
    return null;
  }
}

/**
 * Fetch dengue cluster data from NEA
 * Component: C7 (disease outbreak early warning)
 */
export async function fetchNEADengueClusters() {
  const downloaded = await fetchDatasetDownload("d_f2d4a22e47e4387f4571433c92ba4e8e");
  if (!downloaded) return null;

  const features = Array.isArray(downloaded?.features)
    ? downloaded.features
    : Array.isArray(downloaded?.records)
    ? downloaded.records
    : [];

  return {
    records: features,
    total: features.length,
    raw: downloaded,
  };
}

// ==================== ACRA: Company Registry ====================

/**
 * Fetch company information by UEN/Name from ACRA
 * Component: C4 (contractor safety track record)
 */
export async function fetchACRACompany(companyName: string) {
  return await fetchDatastoreDataset("d_a2141adf93ec2a3c2ec2837b78d6d46e", {
    q: companyName,
    limit: 5,
    revalidate: 86400,
  });
}

/**
 * List all active companies from ACRA
 * Component: C4 (contractor verification)
 */
export async function fetchACRACompanies(offset = 0, limit = 100) {
  const data = await fetchDatastoreDataset("d_a2141adf93ec2a3c2ec2837b78d6d46e", {
    offset,
    limit,
    revalidate: 86400,
  });

  return data
    ? {
        records: data.result?.records || [],
        total: data.result?.total || 0,
      }
    : null;
}

// ==================== BCA: Building & Construction ====================

/**
 * Fetch active BCA construction projects
 * Components: C1 (construction risk), C2 (fall), C3 (machinery), C4 (contractor)
 */
export async function fetchBCAProjects() {
  const data = await fetchDatastoreDataset("d_19573c579879be15623f2e1e3854926d", {
    limit: 50,
    revalidate: 604800,
  });

  return {
    records: data?.result?.records || [],
    total: data?.result?.total || 0,
  };
}

// ==================== HDB: Housing ====================

/**
 * Fetch HDB housing data (for dormitory baseline profiling)
 * Component: C5 (dormitory baseline), C8 (DTS prioritization)
 */
export async function fetchHDBData() {
  const data = await fetchDatastoreDataset("d_17f5382f26140b1fdae0ba2ef6239d2f", {
    limit: 100,
    revalidate: 604800,
  });

  return data
    ? {
        records: data.result?.records || [],
        total: data.result?.total || 0,
      }
    : null;
}

// ==================== URA / Planning Boundaries ====================

export async function fetchPlanningAreaBoundaries() {
  const downloaded = await fetchDatasetDownload(PLANNING_AREA_DATASET_ID);
  if (!downloaded) return null;

  const features = Array.isArray(downloaded?.features) ? downloaded.features : [];
  return {
    type: downloaded.type || "FeatureCollection",
    name: downloaded.name || "PlanningAreas",
    features,
    total: features.length,
  };
}

export async function fetchOneMapLocation(searchValue: string) {
  try {
    const query = new URLSearchParams({
      searchVal: searchValue,
      returnGeom: "Y",
      getAddrDetails: "N",
      pageNum: "1",
    });

    const response = await fetch(`${ONEMAP_SEARCH_URL}?${query.toString()}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`OneMap search error (${searchValue}): ${response.status}`);
    }

    const payload = await response.json();
    const firstResult = payload?.results?.[0];
    if (!firstResult) return null;

    const latitude = Number(firstResult.LATITUDE || firstResult.latitude);
    const longitude = Number(firstResult.LONGITUDE || firstResult.longitude || firstResult.LONGTITUDE);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }

    return {
      searchValue,
      found: payload?.found || 1,
      coordinates: [latitude, longitude] as [number, number],
      name: String(firstResult.SEARCHVAL || firstResult.BUILDING || searchValue),
    };
  } catch (error) {
    console.error(`OneMap search failed for ${searchValue}:`, error);
    return null;
  }
}

// ==================== MOH: Health Data ====================

/**
 * Fetch public health datasets from MOH
 * Component: C7 (disease outbreak), C10 (worker health)
 */
export async function fetchMOHHealthData() {
  try {
    const response = await fetch(
      `${BASE_URL}/datasets?agency=MOH&limit=20&api-key=${API_KEY}`,
      { next: { revalidate: 604800 } } // Cache for 7 days
    );
    if (!response.ok) throw new Error(`MOH Health API error: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("MOH Health fetch failed:", error);
    return null;
  }
}

// ==================== Unified Data Fetcher ====================

export interface DataSourceStatus {
  name: string;
  status: "online" | "offline" | "error";
  lastFetch?: Date;
  recordCount?: number;
  latencyMs?: number;
}

export interface GovernmentDomainIntel {
  construction: {
    activeProjects: number;
    topProjectTypes: string[];
  };
  dormitories: {
    indexedRecords: number;
    topTowns: string[];
  };
  health: {
    datasetCount: number;
    sourceAgency: string;
  };
}

/**
 * Check all data sources and return status
 */
export async function checkAllDataSources(): Promise<DataSourceStatus[]> {
  const statuses: DataSourceStatus[] = [];

  // Check NEA Weather
  let requestStartedAt = Date.now();
  const weather = await fetchNEAWeather();
  statuses.push({
    name: "NEA Real-time Weather",
    status: weather ? "online" : "offline",
    lastFetch: new Date(),
    recordCount: weather?.records?.length || 0,
    latencyMs: Date.now() - requestStartedAt,
  });

  // Check NEA Air Quality
  requestStartedAt = Date.now();
  const airQuality = await fetchNEAAirQuality();
  statuses.push({
    name: "NEA Air Quality (PM2.5)",
    status: airQuality ? "online" : "offline",
    lastFetch: new Date(),
    recordCount: airQuality?.records?.length || 0,
    latencyMs: Date.now() - requestStartedAt,
  });

  // Check ACRA
  requestStartedAt = Date.now();
  const acra = await fetchACRACompanies(0, 5);
  statuses.push({
    name: "ACRA Company Registry",
    status: acra ? "online" : "offline",
    lastFetch: new Date(),
    recordCount: acra?.records?.length || 0,
    latencyMs: Date.now() - requestStartedAt,
  });

  // Check HDB
  requestStartedAt = Date.now();
  const hdb = await fetchHDBData();
  statuses.push({
    name: "HDB Housing Data",
    status: hdb ? "online" : "offline",
    lastFetch: new Date(),
    recordCount: hdb?.records?.length || 0,
    latencyMs: Date.now() - requestStartedAt,
  });

  // Check BCA
  requestStartedAt = Date.now();
  const bca = await fetchBCAProjects();
  statuses.push({
    name: "BCA Construction Projects",
    status: bca ? "online" : "offline",
    lastFetch: new Date(),
    recordCount: bca?.records?.length || 0,
    latencyMs: Date.now() - requestStartedAt,
  });

  // Check MOH
  requestStartedAt = Date.now();
  const moh = await fetchMOHHealthData();
  statuses.push({
    name: "MOH Health Datasets",
    status: moh ? "online" : "offline",
    lastFetch: new Date(),
    recordCount: moh?.data?.length || moh?.records?.length || 0,
    latencyMs: Date.now() - requestStartedAt,
  });

  return statuses;
}

export async function getGovernmentDomainIntel(): Promise<GovernmentDomainIntel> {
  const [bca, hdb, moh] = await Promise.all([
    fetchBCAProjects(),
    fetchHDBData(),
    fetchMOHHealthData(),
  ]);

  const bcaRecords = bca?.records || [];
  const hdbRecords = hdb?.records || [];
  const mohRecords = moh?.data || moh?.records || [];

  const topProjectTypes = (Object.entries(
    bcaRecords.reduce((acc: Record<string, number>, record: any) => {
      const type = String(record.type_of_work || record.project_type || record.type || "Unknown");
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}),
  ) as Array<[string, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type);

  const topTowns = (Object.entries(
    hdbRecords.reduce((acc: Record<string, number>, record: any) => {
      const town = String(record.town || record.address || record.block || "Unknown");
      acc[town] = (acc[town] || 0) + 1;
      return acc;
    }, {}),
  ) as Array<[string, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([town]) => town);

  return {
    construction: {
      activeProjects: bcaRecords.length,
      topProjectTypes,
    },
    dormitories: {
      indexedRecords: hdbRecords.length,
      topTowns,
    },
    health: {
      datasetCount: Array.isArray(mohRecords) ? mohRecords.length : 0,
      sourceAgency: "MOH",
    },
  };
}

// ==================== Data Processing Helpers ====================

/**
 * Calculate C1 Construction Risk Score from weather + project data
 */
export function calculateC1RiskScore(weather: any, projectPhase: string): number {
  let score = 50; // baseline
  
  if (weather?.windSpeed > 30) score += 15; // high wind risk
  if (weather?.rainfall > 10) score += 10; // wet conditions increase fall risk
  if (weather?.temperature > 32) score += 8; // heat stress during construction
  if (projectPhase === "foundation") score += 25; // high-risk phase
  if (projectPhase === "frame") score += 20;
  
  return Math.min(100, score);
}

/**
 * Calculate C6 Heat Stress Index from temperature + humidity
 */
export function calculateC6HeatStress(temperature: number, humidity: number, outdoorExposureHours: number): number {
  const heatIndex = temperature + (0.5555 * (humidity / 100) * (temperature - 14.5)); // Simplified heat index
  let score = 40;
  
  if (heatIndex > 32) score += 20;
  if (heatIndex > 35) score += 25;
  if (humidity > 85) score += 10;
  if (outdoorExposureHours > 8) score += 15;
  
  return Math.min(100, score);
}

/**
 * Calculate C7 Disease Outbreak Risk from air quality + dengue + health data
 */
export function calculateC7DiseaseRisk(pm25: number, dengueClusterCount: number, temperature: number): number {
  let score = 40;
  
  if (pm25 > 50) score += 15; // respiratory risk
  if (pm25 > 75) score += 20;
  if (dengueClusterCount > 0) score += 25; // dengue cluster presence
  if (temperature > 30) score += 10; // mosquito breeding season
  
  return Math.min(100, score);
}

const dataGovSGExports = {
  fetchNEAWeather,
  fetchNEAAirQuality,
  fetchNEADengueClusters,
  fetchACRACompany,
  fetchACRACompanies,
  fetchBCAProjects,
  fetchHDBData,
  fetchMOHHealthData,
  fetchPlanningAreaBoundaries,
  fetchOneMapLocation,
  checkAllDataSources,
  getGovernmentDomainIntel,
  calculateC1RiskScore,
  calculateC6HeatStress,
  calculateC7DiseaseRisk,
};

export default dataGovSGExports;
