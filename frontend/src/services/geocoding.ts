import api from './api';

export interface GeocodingResult {
  name: string | null;
  road_address: string | null;
  jibun_address: string | null;
  latitude: number;
  longitude: number;
}

interface GeocodingResponse {
  results: GeocodingResult[];
}

export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  const response = await api.get<GeocodingResponse>('/geocoding/search', {
    params: { query },
  });
  return response.data.results;
}
