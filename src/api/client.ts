import { getApiBaseUrl } from "../config/apiBaseUrl";
import type {
  RiskScoreRequest,
  RiskScoreResponse,
  ShelterRecommendationRequest,
  ShelterRecommendationResponse,
  DamageAssessmentRequest,
  DamageAssessmentResponse,
  UploadPhotoResponse,
  PriorityQueueRequest,
  PriorityQueueResponse,
  AllocationRequest,
  AllocationResponse,
  RouteRequest,
  RouteResponse,
  AssistantExplainRequest,
  AssistantExplainResponse,
  SeedDataResponse,
  SubmitRescueRequest,
  SubmitRescueRequestResponse,
} from "./types";

/**
 * Thin, typed wrapper around the resqai-backend FastAPI endpoints.
 *
 * Every function here maps 1:1 to an endpoint in resqai-backend/app/main.py.
 * Screens should call these rather than using fetch() directly, so the
 * base URL, error handling, and request/response shapes stay centralized
 * in one place as the backend evolves.
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const url = `${getApiBaseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
  } catch (err) {
    throw new ApiError(
      `Could not reach ${url}. Check that the backend is running and the ` +
        `Settings tab has the correct LAN IP for this device's network.`,
      0
    );
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ApiError(`${res.status} ${res.statusText}: ${detail}`, res.status);
  }
  return res.json() as Promise<TResponse>;
}

function post<TRequest, TResponse>(path: string, body: TRequest): Promise<TResponse> {
  return request<TResponse>(path, { method: "POST", body: JSON.stringify(body) });
}

export const api = {
  health(): Promise<{ status: string; service: string }> {
    return request("/");
  },

  seedData(): Promise<SeedDataResponse> {
    return request("/seed-data");
  },

  riskScore(req: RiskScoreRequest): Promise<RiskScoreResponse> {
    return post("/risk-score", req);
  },

  recommendShelters(req: ShelterRecommendationRequest): Promise<ShelterRecommendationResponse> {
    return post("/shelters/recommend", req);
  },

  damageAssessment(req: DamageAssessmentRequest): Promise<DamageAssessmentResponse> {
    return post("/damage-assessment", req);
  },

  /**
   * Uploads a photo (from expo-image-picker) as multipart/form-data.
   * `photoUri` is the local file:// URI returned by the image picker.
   */
  async uploadPhoto(photoUri: string): Promise<UploadPhotoResponse> {
    const formData = new FormData();
    const filename = photoUri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1] : "jpg";
    // React Native's fetch/FormData accepts this shape for file uploads.
    formData.append("photo", {
      uri: photoUri,
      name: filename,
      type: `image/${ext === "jpg" ? "jpeg" : ext}`,
    } as unknown as Blob);

    const res = await fetch(`${getApiBaseUrl()}/upload-photo`, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (!res.ok) {
      throw new ApiError(`Photo upload failed: ${res.status} ${res.statusText}`, res.status);
    }
    return res.json();
  },

  rescuePriorityQueue(req: PriorityQueueRequest): Promise<PriorityQueueResponse> {
    return post("/rescue-priority-queue", req);
  },

  /**
   * The real citizen-facing submission (SOS screen) -- persists to the
   * backend's database so the request actually shows up in the responder
   * Queue tab on any device, not just this one. Different from
   * rescuePriorityQueue() above, which only scores an already-known batch
   * for demo/testing without persisting anything new.
   */
  submitRescueRequest(req: SubmitRescueRequest): Promise<SubmitRescueRequestResponse> {
    return post("/rescue-requests", req);
  },

  resourceAllocation(req: AllocationRequest): Promise<AllocationResponse> {
    return post("/resource-allocation", req);
  },

  route(req: RouteRequest): Promise<RouteResponse> {
    return post("/route", req);
  },

  assistantExplain(req: AssistantExplainRequest): Promise<AssistantExplainResponse> {
    return post("/assistant/explain", req);
  },
};
