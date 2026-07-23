/**
 * Types mirroring resqai-backend/app/models.py exactly, so the mobile app
 * and backend never silently drift apart on field names/shapes.
 */

export type Mobility = "able" | "injured" | "wheelchair" | "bedridden";

export interface Vulnerability {
  age: number;
  mobility: Mobility;
  medical_needs: boolean;
}

// --- Risk Assessment (Module 1) ---

export interface RiskScoreRequest {
  x: number;
  y: number;
  vulnerability: Vulnerability;
}

export interface RiskScoreResponse {
  risk_score: number;
  risk_level: "low" | "moderate" | "high" | "critical";
  components: Record<string, number>;
  weights: Record<string, number>;
}

// --- Shelter Recommendation (Module 2) ---

export interface ShelterRecommendationRequest {
  x: number;
  y: number;
  vulnerability: Vulnerability;
  top_n?: number;
}

export interface ShelterOption {
  shelter_id: string;
  name: string;
  score: number;
  distance_km: number;
  occupancy_ratio: number;
  at_capacity: boolean;
  accessibility_match: number;
  medical_match: number;
  x: number;
  y: number;
}

export interface ShelterRecommendationResponse {
  recommendations: ShelterOption[];
  explanation: string;
}

// --- Damage Assessment (Module 4) ---

export interface DamageAssessmentRequest {
  image_label?: string;
  image_path?: string;
}

export interface DamageAssessmentResponse {
  damage_severity: number;
  detected_hazards: string[];
  source: string;
  severity_label?: string;
  explanation?: string;
}

export interface UploadPhotoResponse {
  image_path: string;
}

// --- Rescue Priority Queue ---

export interface SubmitRescueRequest {
  x: number;
  y: number;
  vulnerability: Vulnerability;
  image_label?: string;
  image_path?: string;
  // Day 6: lets the backend recognize a retried submission (e.g. the
  // offline queue reconnecting, or the app unsure a prior submit went
  // through) and return the original result instead of creating a
  // duplicate rescue request. See resqai-backend/app/main.py.
  client_request_id?: string;
}

export interface SubmitRescueRequestResponse {
  id: string | null;
  persisted: boolean;
  risk_score: number;
  risk_level: string;
  damage_severity: number;
  damage_severity_label?: string;
  priority_score: number;
  explanation?: string;
  // True if client_request_id matched an existing request -- the
  // returned data is the original submission's, not a new one.
  was_duplicate?: boolean;
}

export interface RescueRequestIn {
  id: string;
  x: number;
  y: number;
  vulnerability: Vulnerability;
  image_label?: string;
  image_path?: string;
  timestamp: number;
}

export interface RescuePriorityOut {
  id: string;
  risk_score: number;
  damage_severity: number;
  priority_score: number;
  timestamp: number;
}

export interface PriorityQueueRequest {
  requests: RescueRequestIn[];
}

export interface PriorityQueueResponse {
  queue: RescuePriorityOut[];
}

// --- Resource Allocation (Module 3) ---

export interface AllocationRequest {
  requests: RescueRequestIn[];
  compare_baseline?: boolean;
}

export interface Assignment {
  request_id: string;
  volunteer_id: string;
  volunteer_name: string;
  distance_km: number;
  priority_score: number;
}

export interface AllocationResult {
  assignments: Assignment[];
  unmet_requests: string[];
}

export interface AllocationResponse {
  optimized: AllocationResult;
  naive_baseline: AllocationResult | null;
}

// --- Evacuation Routing (Module 6) ---

export interface RouteRequest {
  start_x: number;
  start_y: number;
  goal_x: number;
  goal_y: number;
}

export interface RouteResponse {
  path: number[][];
  total_cost: number | null;
  found: boolean;
}

// --- Emergency Assistant (Module 5) ---

export interface AssistantExplainRequest {
  context: "risk" | "shelter";
  x: number;
  y: number;
  vulnerability: Vulnerability;
}

export interface AssistantExplainResponse {
  explanation: string;
  grounding: Record<string, unknown>;
}

// --- Seed data (GET /seed-data) ---

export interface Shelter {
  id: string;
  name: string;
  x: number;
  y: number;
  capacity: number;
  occupancy: number;
  accessibility: { wheelchair: boolean; step_free: boolean };
  medical_capability: "none" | "basic_first_aid" | "clinic";
}

export interface Volunteer {
  id: string;
  name: string;
  x: number;
  y: number;
  capability: string;
}

export interface SeedDataResponse {
  shelters: Shelter[];
  volunteers: Volunteer[];
  rescue_requests: RescueRequestIn[];
  grid_size: number;
  blocked_nodes: number[][];
  hazard_nodes: Record<string, number>;
  live_context: Record<string, unknown>;
}
