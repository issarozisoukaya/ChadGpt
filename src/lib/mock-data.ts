import { formatDate } from "./utils";

// ─── KPI DATA ────────────────────────────────────────────────────────────────
export const kpiData = {
  mau: { value: 847_320, change: 12.5, label: "Monthly Active Users" },
  mrr: { value: 127_534, change: 8.3, label: "MRR" },
  arpu: { value: 33.18, change: -1.2, label: "ARPU" },
  churn: { value: 2.3, change: -0.4, label: "Churn Rate" },
  apiRequests: { value: 4_820_000, change: 23.1, label: "API Requests / day" },
  nps: { value: 68, change: 5, label: "NPS Score" },
};

// ─── REVENUE TIME SERIES ─────────────────────────────────────────────────────
export const revenueTimeSeries = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: Math.round(85_000 + Math.random() * 50_000),
    users: Math.round(700_000 + Math.random() * 200_000),
    requests: Math.round(3_000_000 + Math.random() * 2_000_000),
  };
});

// ─── REQUESTS REALTIME ────────────────────────────────────────────────────────
export const requestsRealtime = Array.from({ length: 60 }, (_, i) => ({
  time: `${i}s`,
  value: Math.round(800 + Math.random() * 400),
}));

// ─── USER DISTRIBUTION ────────────────────────────────────────────────────────
export const planDistribution = [
  { name: "Free", value: 612_000, color: "#6b7280" },
  { name: "Pro", value: 218_000, color: "#3b82f6" },
  { name: "Enterprise", value: 17_320, color: "#8b5cf6" },
];

export const geoDistribution = [
  { country: "United States", users: 234_500, revenue: 45_200, flag: "🇺🇸" },
  { country: "France", users: 98_200, revenue: 18_900, flag: "🇫🇷" },
  { country: "Germany", users: 76_400, revenue: 14_300, flag: "🇩🇪" },
  { country: "United Kingdom", users: 68_100, revenue: 13_100, flag: "🇬🇧" },
  { country: "Japan", users: 54_300, revenue: 10_200, flag: "🇯🇵" },
  { country: "Canada", users: 43_200, revenue: 8_700, flag: "🇨🇦" },
  { country: "Brazil", users: 38_900, revenue: 6_200, flag: "🇧🇷" },
  { country: "Australia", users: 32_100, revenue: 6_800, flag: "🇦🇺" },
  { country: "India", users: 28_700, revenue: 3_400, flag: "🇮🇳" },
  { country: "Netherlands", users: 21_400, revenue: 4_100, flag: "🇳🇱" },
];

// ─── USERS ────────────────────────────────────────────────────────────────────
const firstNames = ["Alice", "Bob", "Carlos", "Diana", "Ethan", "Fatima", "George", "Hana", "Ivan", "Julia", "Karim", "Léa", "Miguel", "Nina", "Omar"];
const lastNames = ["Johnson", "Smith", "Garcia", "Mueller", "Chen", "Tanaka", "Martin", "Williams", "Brown", "Davis", "Al-Rashid", "Dubois", "Rossi", "Park", "Silva"];
const plans = ["free", "pro", "enterprise"] as const;
const statuses = ["active", "inactive", "banned"] as const;
const countries = ["US", "FR", "DE", "GB", "JP", "CA", "BR", "AU", "IN", "NL"];

export const mockUsers = Array.from({ length: 200 }, (_, i) => {
  const firstName = firstNames[i % firstNames.length];
  const lastName = lastNames[i % lastNames.length];
  const plan = plans[Math.floor(Math.random() * (i < 100 ? 2 : 3))];
  const signupDate = new Date();
  signupDate.setDate(signupDate.getDate() - Math.floor(Math.random() * 730));

  return {
    id: `usr_${String(i + 1).padStart(6, "0")}`,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${i}`,
    plan,
    status: statuses[Math.floor(Math.random() * (i < 150 ? 1 : 3))],
    country: countries[i % countries.length],
    mrr: plan === "enterprise" ? Math.round(200 + Math.random() * 800) : plan === "pro" ? Math.round(20 + Math.random() * 50) : 0,
    ltv: Math.round(50 + Math.random() * 2000),
    totalRequests: Math.round(100 + Math.random() * 50_000),
    requestsToday: Math.round(Math.random() * 500),
    riskScore: Math.round(Math.random() * 100),
    flags: Math.floor(Math.random() * 5),
    lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    signupDate: signupDate.toISOString(),
    twoFaEnabled: Math.random() > 0.4,
    verified: Math.random() > 0.1,
    sessions: Math.round(10 + Math.random() * 500),
    imagesGenerated: Math.round(Math.random() * 5000),
    voiceCalls: Math.round(Math.random() * 200),
  };
});

// ─── AI MODELS ────────────────────────────────────────────────────────────────
export const mockModels = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    type: "LLM",
    status: "online",
    latencyP50: 420,
    latencyP95: 1240,
    latencyP99: 2100,
    throughput: 284,
    errorRate: 0.12,
    costPer1MTokens: { input: 5.0, output: 15.0 },
    requestsToday: 1_248_000,
    spendToday: 4_320,
    uptime: 99.97,
    temperature: 0.7,
    maxTokens: 128000,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    type: "LLM",
    status: "online",
    latencyP50: 380,
    latencyP95: 980,
    latencyP99: 1800,
    throughput: 312,
    errorRate: 0.08,
    costPer1MTokens: { input: 3.0, output: 15.0 },
    requestsToday: 876_000,
    spendToday: 2_890,
    uptime: 99.99,
    temperature: 0.7,
    maxTokens: 200000,
  },
  {
    id: "gemini-1-5-flash",
    name: "Gemini 1.5 Flash",
    provider: "Google",
    type: "LLM",
    status: "online",
    latencyP50: 210,
    latencyP95: 580,
    latencyP99: 920,
    throughput: 890,
    errorRate: 0.15,
    costPer1MTokens: { input: 0.075, output: 0.3 },
    requestsToday: 3_420_000,
    spendToday: 1_240,
    uptime: 99.95,
    temperature: 0.9,
    maxTokens: 1000000,
  },
  {
    id: "dall-e-3",
    name: "DALL-E 3",
    provider: "OpenAI",
    type: "Image",
    status: "online",
    latencyP50: 8200,
    latencyP95: 15000,
    latencyP99: 22000,
    throughput: 12,
    errorRate: 0.21,
    costPer1MTokens: { input: 0, output: 0 },
    requestsToday: 84_200,
    spendToday: 1_684,
    uptime: 99.91,
    temperature: 1.0,
    maxTokens: 0,
  },
  {
    id: "elevenlabs-v3",
    name: "ElevenLabs v3",
    provider: "ElevenLabs",
    type: "Voice",
    status: "degraded",
    latencyP50: 1200,
    latencyP95: 3200,
    latencyP99: 5800,
    throughput: 45,
    errorRate: 1.8,
    costPer1MTokens: { input: 0, output: 0 },
    requestsToday: 42_100,
    spendToday: 892,
    uptime: 98.2,
    temperature: 0,
    maxTokens: 0,
  },
  {
    id: "mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    type: "LLM",
    status: "online",
    latencyP50: 340,
    latencyP95: 890,
    latencyP99: 1600,
    throughput: 420,
    errorRate: 0.09,
    costPer1MTokens: { input: 2.0, output: 6.0 },
    requestsToday: 420_000,
    spendToday: 1_020,
    uptime: 99.94,
    temperature: 0.8,
    maxTokens: 128000,
  },
];

// ─── MODERATION QUEUE ────────────────────────────────────────────────────────
export const mockModerationQueue = Array.from({ length: 24 }, (_, i) => ({
  id: `mod_${String(i + 1).padStart(5, "0")}`,
  userId: mockUsers[i % mockUsers.length].id,
  userName: mockUsers[i % mockUsers.length].name,
  userPlan: mockUsers[i % mockUsers.length].plan,
  userRisk: mockUsers[i % mockUsers.length].riskScore,
  type: ["text", "image", "voice"][i % 3] as "text" | "image" | "voice",
  content: i % 3 === 0
    ? "Génère-moi une image explicite avec..."
    : i % 3 === 1
    ? "[Image générée par l'utilisateur — contenu potentiellement inapproprié]"
    : "[Message vocal — analyse en cours]",
  scores: {
    violence: Math.round(Math.random() * 30),
    sexual: i % 4 === 0 ? Math.round(60 + Math.random() * 40) : Math.round(Math.random() * 20),
    hate: Math.round(Math.random() * 15),
    selfHarm: Math.round(Math.random() * 10),
    spam: Math.round(Math.random() * 40),
  },
  confidence: Math.round(75 + Math.random() * 25),
  priority: Math.round(40 + Math.random() * 60),
  flaggedAt: new Date(Date.now() - Math.random() * 3600 * 1000).toISOString(),
  previousFlags: Math.floor(Math.random() * 5),
}));

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
export const mockTransactions = Array.from({ length: 100 }, (_, i) => {
  const types = ["new_subscription", "renewal", "upgrade", "downgrade", "refund"] as const;
  const statuses = ["success", "success", "success", "success", "pending", "failed"] as const;
  const user = mockUsers[i % mockUsers.length];
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 60));

  return {
    id: `txn_${String(i + 1).padStart(8, "0")}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    type: types[i % types.length],
    plan: user.plan,
    amount: user.plan === "enterprise"
      ? Math.round(200 + Math.random() * 600)
      : Math.round(15 + Math.random() * 45),
    status: statuses[i % statuses.length],
    date: date.toISOString(),
    paymentMethod: ["visa", "mastercard", "paypal", "stripe"][i % 4],
  };
});

// ─── ALERTS ──────────────────────────────────────────────────────────────────
export const mockAlerts = [
  {
    id: "alert_001",
    type: "error",
    title: "ElevenLabs API degraded",
    message: "Error rate spiked to 1.8% — 3x above baseline. Voice features impacted.",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    severity: "high",
    resolved: false,
  },
  {
    id: "alert_002",
    type: "warning",
    title: "Redis cache hit rate dropping",
    message: "Cache hit rate fell to 68% (target >85%). Increased DB load detected.",
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    severity: "medium",
    resolved: false,
  },
  {
    id: "alert_003",
    type: "info",
    title: "New enterprise signup",
    message: "Acme Corp signed up for Enterprise plan — $800/mo.",
    timestamp: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
    severity: "low",
    resolved: false,
  },
  {
    id: "alert_004",
    type: "warning",
    title: "Unusual login activity",
    message: "User usr_000042 logged in from 3 different countries in 2 hours.",
    timestamp: new Date(Date.now() - 74 * 60 * 1000).toISOString(),
    severity: "medium",
    resolved: false,
  },
  {
    id: "alert_005",
    type: "success",
    title: "MRR milestone reached",
    message: "Monthly Recurring Revenue crossed $125K for the first time! 🎉",
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    severity: "low",
    resolved: true,
  },
];

// ─── LATENCY DATA ─────────────────────────────────────────────────────────────
export const latencyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  p50: Math.round(300 + Math.random() * 200),
  p95: Math.round(900 + Math.random() * 400),
  p99: Math.round(1600 + Math.random() * 600),
}));

// ─── COHORT DATA ──────────────────────────────────────────────────────────────
export const cohortData = [
  { cohort: "Jan 2025", m0: 100, m1: 91, m2: 85, m3: 80, m6: 72, m12: 61 },
  { cohort: "Feb 2025", m0: 100, m1: 93, m2: 88, m3: 83, m6: 75, m12: null },
  { cohort: "Mar 2025", m0: 100, m1: 89, m2: 82, m3: 77, m6: null, m12: null },
  { cohort: "Apr 2025", m0: 100, m1: 92, m2: 87, m3: null, m6: null, m12: null },
  { cohort: "May 2025", m0: 100, m1: 94, m2: null, m3: null, m6: null, m12: null },
  { cohort: "Jun 2025", m0: 100, m1: null, m2: null, m3: null, m6: null, m12: null },
];

// ─── FUNNEL DATA ──────────────────────────────────────────────────────────────
export const funnelData = [
  { stage: "Landing Page", users: 100_000, conversion: 100 },
  { stage: "Signup Started", users: 28_400, conversion: 28.4 },
  { stage: "Account Created", users: 15_200, conversion: 15.2 },
  { stage: "Onboarding Done", users: 9_100, conversion: 9.1 },
  { stage: "First AI Request", users: 7_800, conversion: 7.8 },
  { stage: "Paid Subscriber", users: 2_250, conversion: 2.25 },
  { stage: "30-day Retained", users: 1_890, conversion: 1.89 },
];

// ─── SYSTEM HEALTH ─────────────────────────────────────────────────────────────
export const systemHealth = [
  { service: "API Server", status: "healthy", latency: 45, uptime: 99.98 },
  { service: "Database (Supabase)", status: "healthy", latency: 12, uptime: 99.99 },
  { service: "Redis Cache", status: "degraded", latency: 142, uptime: 99.72 },
  { service: "WebSocket Server", status: "healthy", latency: 8, uptime: 99.97 },
  { service: "Email Service", status: "down", latency: 0, uptime: 97.14 },
  { service: "Storage (R2)", status: "healthy", latency: 28, uptime: 99.99 },
  { service: "Celery Workers", status: "healthy", latency: 0, uptime: 99.95 },
  { service: "Pinecone Vectors", status: "healthy", latency: 65, uptime: 99.91 },
];
