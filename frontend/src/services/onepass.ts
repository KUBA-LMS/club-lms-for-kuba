import api from './api';
import { OnePassListResponse } from '../types/onepass';

export async function getOnePassTickets(): Promise<OnePassListResponse> {
  const response = await api.get<OnePassListResponse>('/tickets/onepass');
  return response.data;
}
