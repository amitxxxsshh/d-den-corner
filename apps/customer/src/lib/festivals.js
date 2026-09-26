import { apiRequest } from "./api";

export async function getCurrentFestivals() {
  return apiRequest("/api/festivals/current");
}