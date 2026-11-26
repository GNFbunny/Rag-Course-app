import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  RefreshCw,
  Bell,
  Database,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  Search,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  ArrowUpDown,
  Clock,
  DollarSign,
  Activity,
  Radio,
  Zap,
  RotateCcw,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  Box,
  GitBranch,
  Smartphone,
  FileJson,
  ChevronRight,
  Pause
} from 'lucide-react';

// ============================================================================
// CONSTANTS, AGENT DEFINITIONS & CATALOG DATA
// ============================================================================

const AGENTS = {
  PlanningAgent: {
    id: 'PlanningAgent',
    label: 'PlanningAgent',
    role: 'Top-Level Orchestrator',
    tech: 'Workflow + memory.json',
    color: '#6366f1',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/40',
    text: 'text-indigo-400',
    ring: 'ring-indigo-500/50',
    ansi: 'text-indigo-400'
  },
  ScannerAgent: {
    id: 'ScannerAgent',
    label: 'ScannerAgent',
    role: 'RSS + Structured Filter',
    tech: 'DealNews + Pydantic',
    color: '#06b6d4',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/40',
    text: 'text-cyan-400',
    ring: 'ring-cyan-500/50',
    ansi: 'text-cyan-400'
  },
  SpecialistAgent: {
    id: 'SpecialistAgent',
    label: 'SpecialistAgent',
    role: 'Fine-Tuned Pricer',
    tech: 'QLoRA Llama-3.1-8B (Modal T4)',
    color: '#a855f7',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
    ring: 'ring-purple-500/50',
    ansi: 'text-purple-400'
  },
  FrontierAgent: {
    id: 'FrontierAgent',
    label: 'FrontierAgent',
    role: 'RAG-Grounded Estimator',
    tech: 'ChromaDB (400K) + LLM',
    color: '#10b981',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    ring: 'ring-emerald-500/50',
    ansi: 'text-emerald-400'
  },
  RandomForestAgent: {
    id: 'RandomForestAgent',
    label: 'RandomForestAgent',
    role: 'Statistical Baseline',
    tech: 'Scikit-Learn Regressor',
    color: '#f59e0b',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    ring: 'ring-amber-500/50',
    ansi: 'text-amber-400'
  },
  EnsembleAgent: {
    id: 'EnsembleAgent',
    label: 'EnsembleAgent',
    role: 'Meta-Regressor',
    tech: 'Ridge Weighted Blend',
    color: '#3b82f6',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    ring: 'ring-blue-500/50',
    ansi: 'text-blue-400'
  },
  MessengerAgent: {
    id: 'MessengerAgent',
    label: 'MessengerAgent',
    role: 'Bargain Alerter',
    tech: 'Pushover REST API',
    color: '#f43f5e',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    ring: 'ring-rose-500/50',
    ansi: 'text-rose-400'
  }
};

const CATEGORIES = [
  { name: 'Electronics', color: '#38bdf8', center: [0.65, 0.55, 0.45] },
  { name: 'Appliances', color: '#fb7185', center: [-0.65, 0.50, 0.35] },
  { name: 'Automotive', color: '#fbbf24', center: [-0.55, -0.60, 0.45] },
  { name: 'Home & Kitchen', color: '#34d399', center: [0.55, -0.50, 0.40] },
  { name: 'Musical Instruments', color: '#c084fc', center: [0.25, 0.65, -0.55] },
  { name: 'Office Products', color: '#60a5fa', center: [-0.30, 0.25, -0.65] },
  { name: 'Tools & Home Improvement', color: '#f97316', center: [-0.65, -0.25, -0.50] },
  { name: 'Toys & Games', color: '#f472b6', center: [0.55, -0.35, -0.55] }
];

// Deterministic pseudo-random generator for stable 3D t-SNE points
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate 280 representative 3D points sampled from the 400K ChromaDB Amazon catalog
function generateVectorCatalog() {
  const rng = mulberry32(20261126);
  const sampleTitles = {
    Electronics: [
      'Bose QuietComfort Ultra Headphones', 'Samsung 990 PRO 2TB NVMe SSD', 'Apple AirPods Pro 2 USB-C',
      'LG UltraGear 27" QHD 180Hz Monitor', 'Sony Alpha a6400 Mirrorless Body', 'Anker Prime 27,650mAh Power Bank',
      'Logitech MX Master 3S Wireless Mouse', 'Garmin Forerunner 265 GPS Watch', 'Sonos Era 100 Smart Speaker'
    ],
    Appliances: [
      'Breville Barista Express Espresso Machine', 'Dyson V15 Detect Cordless Vacuum', 'Ninja Creami Deluxe 11-in-1',
      'KitchenAid Artisan 5-Qt Stand Mixer', 'Miele Classic C1 Canister Vacuum', 'Vitamix 5200 Professional Blender',
      'Instant Pot Pro 10-in-1 Pressure Cooker', 'Shark Stratos Cordless Stick Vacuum'
    ],
    Automotive: [
      'NOCO Boost Pro GB150 3000A Jump Starter', 'Garmin Dash Cam Mini 2 1080p', 'WeatherTech Custom FloorLiner Set',
      'Chemical Guys Hol169 Car Wash Kit', 'VIAIR 88P Portable Air Compressor', 'BlueDriver Bluetooth Pro OBD2 Scanner'
    ],
    'Home & Kitchen': [
      'Le Creuset Signature 5.5 Qt Dutch Oven', 'All-Clad D3 Stainless 10-Piece Cookware', 'YETI Tundra 45 Hard Cooler',
      'Fellow Stagg EKG Electric Pour-Over Kettle', 'Staub Cast Iron 4-Qt Cocotte', 'Zwilling Pro 7-Piece Knife Block'
    ],
    'Musical Instruments': [
      'Focusrite Scarlett 2i2 4th Gen Interface', 'Shure SM7B Dynamic Vocal Microphone', 'Fender Player Stratocaster Electric Guitar',
      'Yamaha HS5 Powered Studio Monitor Pair', 'Roland FP-30X Digital Piano', 'Audio-Technica ATH-M50x Headphones'
    ],
    'Office Products': [
      'Herman Miller Sayl Ergonomic Chair', 'Elgato Stream Deck MK.2 Controller', 'Brother HL-L2350DW Compact Laser Printer',
      'Keychron Q1 Pro QMK/VIA Mechanical Keyboard', 'BenQ ScreenBar Halo LED Monitor Light', 'Epson EcoTank ET-2850 Printer'
    ],
    'Tools & Home Improvement': [
      'Milwaukee M18 FUEL Hammer Drill Kit', 'DeWalt 20V MAX XR Impact Driver', 'Makita 18V LXT Brushless Circular Saw',
      'Fluke 117 Electricians True RMS Multimeter', 'Bosch Blaze GLM165-40 Laser Measure', 'Knipex Cobra Pliers 3-Piece Set'
    ],
    'Toys & Games': [
      'LEGO Star Wars Millennium Falcon 75257', 'Nintendo Switch OLED Model Console', 'DJI Mini 4K Camera Drone',
      'LEGO Technic Porsche 911 RSR Set', 'Catan 3D Edition Board Game', 'Meta Quest 3 128GB VR Headset'
    ]
  };

  const points = [];
  CATEGORIES.forEach((cat, catIdx) => {
    const titles = sampleTitles[cat.name];
    for (let i = 0; i < 35; i++) {
      // Box-Muller Gaussian spread around cluster center
      const u1 = Math.max(0.0001, rng());
      const u2 = rng();
      const u3 = Math.max(0.0001, rng());
      const u4 = rng();
      const gx = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 0.22;
      const gy = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2) * 0.22;
      const gz = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4) * 0.22;

      const baseTitle = titles[i % titles.length];
      const basePrice = Math.round((45 + rng() * 520) * 100) / 100;
      points.push({
        id: `vec-${catIdx}-${i}`,
        title: i < titles.length ? baseTitle : `${baseTitle} (Variant ${i - titles.length + 2})`,
        category: cat.name,
        color: cat.color,
        price: basePrice,
        x: cat.center[0] + gx,
        y: cat.center[1] + gy,
        z: cat.center[2] + gz
      });
    }
  });
  return points;
}

// Initial 2 deals pre-populated in memory.json so the dashboard is immediately alive
const INITIAL_DEALS = [
  {
    id: 'deal-init-1',
    title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones (Refurbished Certified)',
    description:
      'Industry-leading active noise cancellation with dual processors, 8 microphones, 30-hour battery life, multipoint Bluetooth 5.2, and carrying case.',
    category: 'Electronics',
    url: 'https://dealnews.com/products/sony-wh-1000xm5-wireless-anc-headphones',
    dealPrice: 219.99,
    specialistEst: 342.5,
    frontierEst: 358.0,
    rfEst: 318.4,
    ensembleEst: 345.88,
    discount: 125.89,
    discountPct: 36.4,
    latencies: { scanner: 2.1, specialist: 0.78, frontier: 1.05, rf: 0.04, ensemble: 0.02 },
    status: 'Alert Sent',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    source: 'DealNews RSS',
    neighbors: [
      { title: 'Sony WH-1000XM5 Wireless Industry Leading ANC Headphones', price: 398.0, similarity: 0.964 },
      { title: 'Sony WH-1000XM4 Wireless Premium Noise Canceling Overhead', price: 348.0, similarity: 0.932 },
      { title: 'Bose QuietComfort Ultra Wireless Noise Cancelling Headphones', price: 429.0, similarity: 0.901 },
      { title: 'Sennheiser Momentum 4 Wireless Bluetooth Headphones', price: 299.95, similarity: 0.887 },
      { title: 'Apple AirPods Max Wireless Over-Ear Headphones', price: 479.0, similarity: 0.854 }
    ]
  },
  {
    id: 'deal-init-2',
    title: 'Breville Barista Express Espresso Machine BES870XL Stainless Steel',
    description:
      'All-in-one espresso machine with integrated conical burr grinder, 15-bar Italian pump, PID digital temperature control, and manual microfoam steam wand.',
    category: 'Appliances',
    url: 'https://dealnews.com/products/breville-barista-express-bes870xl',
    dealPrice: 549.95,
    specialistEst: 695.0,
    frontierEst: 718.5,
    rfEst: 642.0,
    ensembleEst: 697.63,
    discount: 147.68,
    discountPct: 21.2,
    latencies: { scanner: 2.4, specialist: 0.84, frontier: 1.12, rf: 0.05, ensemble: 0.02 },
    status: 'Alert Sent',
    timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    source: 'DealNews RSS',
    neighbors: [
      { title: 'Breville BES870XL Barista Express Espresso Machine Brushed Steel', price: 749.95, similarity: 0.981 },
      { title: 'Breville Barista Pro Espresso Machine BES878BSS', price: 849.95, similarity: 0.935 },
      { title: 'DeLonghi La Specialista Arte Espresso Machine with Grinder', price: 699.95, similarity: 0.912 },
      { title: 'Breville Bambino Plus Compact Espresso Machine', price: 499.95, similarity: 0.879 },
      { title: 'Gaggia Classic Evo Pro Semi-Automatic Espresso Maker', price: 449.0, similarity: 0.845 }
    ]
  }
];

// Pool of realistic DealNews RSS feed items for autonomous cycles
const RSS_FEED_POOL = [
  {
    title: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe M.2 Internal SSD w/ Heatsink',
    description:
      'Sequential read speeds up to 7,450 MB/s and write speeds up to 6,900 MB/s. Ideal for PlayStation 5, gaming PCs, and heavy 4K video editing workloads.',
    category: 'Electronics',
    url: 'https://dealnews.com/products/samsung-990-pro-2tb-nvme-heatsink',
    dealPrice: 129.99,
    specialistEst: 194.0,
    frontierEst: 204.5,
    rfEst: 182.0,
    neighbors: [
      { title: 'Samsung 990 PRO Series 2TB PCIe Gen4 NVMe M.2 SSD', price: 189.99, similarity: 0.974 },
      { title: 'WD_BLACK 2TB SN850X NVMe Internal Gaming SSD w/ Heatsink', price: 179.99, similarity: 0.941 },
      { title: 'Samsung 980 PRO 2TB PCIe 4.0 NVMe M.2 SSD Heatsink', price: 169.99, similarity: 0.928 },
      { title: 'Crucial T500 2TB Gen4 NVMe M.2 Internal Gaming SSD', price: 159.99, similarity: 0.903 },
      { title: 'SK hynix Platinum P41 2TB PCIe NVMe Gen4 M.2 SSD', price: 164.99, similarity: 0.891 }
    ]
  },
  {
    title: 'Milwaukee M18 FUEL 18V Brushless Cordless 1/2" Hammer Drill & Impact Kit',
    description:
      '2-tool combo kit featuring POWERSTATE brushless motor, REDLINK PLUS intelligence, two M18 REDLITHIUM XC5.0 batteries, charger, and hard carrying case.',
    category: 'Tools & Home Improvement',
    url: 'https://dealnews.com/products/milwaukee-m18-fuel-2-tool-combo-kit',
    dealPrice: 279.0,
    specialistEst: 388.5,
    frontierEst: 399.0,
    rfEst: 356.2,
    neighbors: [
      { title: 'Milwaukee M18 FUEL 18V Lithium-Ion Brushless 2-Tool Combo Kit', price: 399.0, similarity: 0.978 },
      { title: 'DeWalt 20V MAX XR Brushless Hammer Drill & Impact Combo Kit', price: 349.0, similarity: 0.937 },
      { title: 'Makita 18V LXT Brushless 2-Piece Combo Kit (5.0Ah)', price: 379.0, similarity: 0.919 },
      { title: 'Milwaukee M18 Compact Brushless 1/2 in. Hammer Drill Kit', price: 249.0, similarity: 0.884 },
      { title: 'Bosch 18V Brushless Connected-Ready Hammer Drill Driver Kit', price: 299.0, similarity: 0.861 }
    ]
  },
  {
    title: 'Anker 737 Power Bank (PowerCore 24K) 140W Bi-Directional Fast Charger',
    description:
      '24,000mAh portable laptop charger with Power Delivery 3.1, smart digital display showing real-time wattage output, compatible with MacBook Pro & Steam Deck.',
    category: 'Electronics',
    url: 'https://dealnews.com/products/anker-737-powercore-24k-140w',
    dealPrice: 109.99,
    specialistEst: 138.0,
    frontierEst: 144.99,
    rfEst: 126.5,
    neighbors: [
      { title: 'Anker 737 Power Bank 24,000mAh 3-Port 140W Portable Charger', price: 149.99, similarity: 0.985 },
      { title: 'Anker Prime 20,000mAh Power Bank 200W Smart Display', price: 129.99, similarity: 0.942 },
      { title: 'UGREEN Nexode 25,000mAh 145W Laptop Power Bank', price: 119.99, similarity: 0.918 },
      { title: 'Baseus Blade 20,000mAh 100W Ultra-Thin Laptop Power Bank', price: 99.99, similarity: 0.875 },
      { title: 'Shargeek 170 Transparent 24,000mAh Power Bank', price: 169.0, similarity: 0.858 }
    ]
  },
  {
    title: 'Focusrite Scarlett 4i4 4th Gen USB-C Audio Interface Studio Bundle',
    description:
      '4-in, 4-out USB audio interface with ultra-low-noise mic preamps, Auto Gain, Clip Safe, Air Mode, 120dB dynamic range converters, and studio software suite.',
    category: 'Musical Instruments',
    url: 'https://dealnews.com/products/focusrite-scarlett-4i4-4th-gen',
    dealPrice: 179.99,
    specialistEst: 268.0,
    frontierEst: 279.99,
    rfEst: 248.5,
    neighbors: [
      { title: 'Focusrite Scarlett 4i4 4th Gen USB Audio Interface', price: 279.99, similarity: 0.982 },
      { title: 'Focusrite Scarlett 2i2 4th Gen USB Audio Interface', price: 199.99, similarity: 0.948 },
      { title: 'Universal Audio Volt 476 USB-C Audio Interface', price: 369.0, similarity: 0.906 },
      { title: 'SSL 2+ MKII 2-In 4-Out USB-C Audio Interface', price: 299.99, similarity: 0.892 },
      { title: 'MOTU M4 4x4 USB-C Audio Interface with Studio Metering', price: 269.95, similarity: 0.881 }
    ]
  },
  {
    title: 'Le Creuset Enameled Cast Iron Signature Round Dutch Oven 5.5 Qt (Flame)',
    description:
      'Heirloom French enameled cast iron Dutch oven engineered for even heat distribution, ergonomic handles, tight-fitting lid, oven-safe up to 500°F.',
    category: 'Home & Kitchen',
    url: 'https://dealnews.com/products/le-creuset-signature-5-5-qt-dutch-oven',
    dealPrice: 289.95,
    specialistEst: 412.0,
    frontierEst: 419.95,
    rfEst: 374.0,
    neighbors: [
      { title: 'Le Creuset Signature Enameled Cast Iron Round Dutch Oven 5.5 Qt', price: 419.95, similarity: 0.989 },
      { title: 'Staub Cast Iron 5.5-Quart Round Cocotte Made in France', price: 399.95, similarity: 0.946 },
      { title: 'Le Creuset Signature Oval Dutch Oven 6.75 Qt', price: 459.95, similarity: 0.922 },
      { title: 'Lodge 6 Quart Enameled Cast Iron Dutch Oven', price: 79.9, similarity: 0.842 },
      { title: 'All-Clad Copper Core 5-Ply Bonded 5.5 Qt Dutch Oven', price: 379.99, similarity: 0.831 }
    ]
  },
  {
    title: 'NOCO Boost Pro GB150 3000A 12V UltraSafe Lithium Jump Starter Box',
    description:
      'Heavy-duty portable lithium car battery booster pack for up to 9.0L gas and 7.0L diesel engines, integrated voltmeter, 500-lumen LED flashlight, and 12V output.',
    category: 'Automotive',
    url: 'https://dealnews.com/products/noco-boost-pro-gb150-3000a',
    dealPrice: 199.95,
    specialistEst: 292.0,
    frontierEst: 299.95,
    rfEst: 265.0,
    neighbors: [
      { title: 'NOCO Boost Pro GB150 3000A UltraSafe Car Battery Jump Starter', price: 299.95, similarity: 0.988 },
      { title: 'NOCO Boost X GBX75 2500A 12V UltraSafe Lithium Jump Starter', price: 249.95, similarity: 0.944 },
      { title: 'NOCO Boost HD GB70 2000A 12V Car Battery Jump Starter', price: 199.95, similarity: 0.925 },
      { title: 'Gooloo GT4000S 4000A Peak SuperSafe Car Jump Starter', price: 159.99, similarity: 0.878 },
      { title: 'Clore Automotive Jump-N-Carry JNC660 1700 Peak Amp', price: 164.5, similarity: 0.851 }
    ]
  },
  {
    title: 'Keychron Q1 Pro QMK/VIA Wireless Custom Mechanical Keyboard (Aluminum)',
    description:
      'Full CNC machined aluminum 75% wireless mechanical keyboard with double-gasket design, hot-swappable K Pro Brown switches, PBT keycaps, and Mac/Windows support.',
    category: 'Office Products',
    url: 'https://dealnews.com/products/keychron-q1-pro-wireless-mechanical',
    dealPrice: 169.0,
    specialistEst: 202.0,
    frontierEst: 209.0,
    rfEst: 188.5,
    neighbors: [
      { title: 'Keychron Q1 Pro QMK/VIA Wireless Custom Mechanical Keyboard', price: 209.0, similarity: 0.986 },
      { title: 'Keychron Q2 Pro 65% Wireless Aluminum Mechanical Keyboard', price: 199.0, similarity: 0.941 },
      { title: 'NuPhy Halo75 V2 Wireless Mechanical Keyboard', price: 149.95, similarity: 0.892 },
      { title: 'Logitech MX Mechanical Wireless Illuminated Keyboard', price: 169.99, similarity: 0.864 },
      { title: 'ASUS ROG Azoth 75% Wireless DIY Custom Gaming Keyboard', price: 249.99, similarity: 0.853 }
    ]
  },
  {
    title: 'DJI Mini 4K Camera Drone Fly More Combo w/ 3 Batteries & 3-Axis Gimbal',
    description:
      'Under 249g lightweight foldable 4K UHD camera drone with 10km HD video transmission, Level 5 wind resistance, 93-minute total flight time with 3 batteries.',
    category: 'Toys & Games',
    url: 'https://dealnews.com/products/dji-mini-4k-fly-more-combo',
    dealPrice: 319.0,
    specialistEst: 438.0,
    frontierEst: 449.0,
    rfEst: 405.5,
    neighbors: [
      { title: 'DJI Mini 4K Fly More Combo Drone with 4K UHD Camera', price: 449.0, similarity: 0.984 },
      { title: 'DJI Mini 3 Fly More Combo Lightweight Camera Drone', price: 549.0, similarity: 0.942 },
      { title: 'DJI Mini 4K Standard Edition Camera Drone', price: 299.0, similarity: 0.928 },
      { title: 'Potensic ATOM SE GPS Drone with 4K EIS Camera Fly More', price: 289.99, similarity: 0.876 },
      { title: 'Holy Stone HS720G 2-Axis Gimbal 4K Foldable GPS Drone', price: 249.99, similarity: 0.844 }
    ]
  }
];

const SANDBOX_PRESETS = [
  {
    label: 'Shure MV7+ Podcast Mic',
    title: 'Shure MV7+ Podcast Dynamic Microphone (USB-C & XLR, LED Touch Panel)',
    description:
      'Hybrid USB-C and XLR dynamic broadcast microphone with real-time Denoiser, Digital Popper Stopper, customizable RGB LED touch-to-mute strip, and MOTIV Mix DSP.',
    category: 'Musical Instruments',
    dealPrice: 189.0
  },
  {
    label: 'Sony WH-1000XM5 ANC',
    title: 'Sony WH-1000XM5 Wireless Noise-Canceling Over-Ear Headphones (Midnight Blue)',
    description:
      'Flagship Bluetooth 5.2 headphones with Auto NC Optimizer, 8 microphones, 30-hour battery, Speak-to-Chat, and ultra-comfortable soft fit leather.',
    category: 'Electronics',
    dealPrice: 229.99
  },
  {
    label: 'DeWalt 20V MAX Drill Kit',
    title: 'DeWalt 20V MAX XR Brushless Cordless 1/2" Hammer Drill & Impact Driver Combo',
    description:
      'Heavy-duty 2-tool brushless kit with two 5.0Ah lithium-ion batteries, rapid charger, 3-speed transmission, LED work light, and contractor bag.',
    category: 'Tools & Home Improvement',
    dealPrice: 219.0
  }
];

// Ridge meta-regressor weights matching the Week 8 EnsembleAgent
function computeEnsemble(frontierEst, specialistEst, rfEst) {
  const weighted = 0.45 * frontierEst + 0.40 * specialistEst + 0.15 * rfEst;
  return Math.round(weighted * 100) / 100;
}

function formatTime(dateInput) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ============================================================================
// GEMINI API HELPER (FrontierAgent Live Sandbox with Exponential Backoff)
// ============================================================================

async function callGeminiFrontierAgent(title, description, category) {
  const apiKey = ''; // Automatically injected by Canvas runtime
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  const systemPrompt = `You are the FrontierAgent inside an autonomous e-commerce price estimation multi-agent system ("The Price is Right").
Given a product title, category, and description, simulate retrieving the 5 most similar historical Amazon catalog products from a 400K ChromaDB vector database and produce a grounded retail market value estimate in USD.
Be realistic and accurate with real-world US retail prices. Return strictly valid JSON matching the schema.`;

  const userQuery = `Product Title: ${title}
Category: ${category}
Description: ${description}

Retrieve 5 comparable Amazon retail products (with realistic US retail prices and cosine similarity scores between 0.84 and 0.98) and estimate the fair US retail market price of this product.`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          frontierEstimate: { type: 'NUMBER' },
          reasoning: { type: 'STRING' },
          neighbors: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                price: { type: 'NUMBER' },
                similarity: { type: 'NUMBER' }
              },
              required: ['title', 'price', 'similarity']
            }
          }
        },
        required: ['frontierEstimate', 'reasoning', 'neighbors']
      }
    }
  };

  const delays = [1000, 2000, 4000];
  let lastError = null;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty model response');

      const parsed = JSON.parse(text);
      if (
        typeof parsed.frontierEstimate === 'number' &&
        parsed.frontierEstimate > 0 &&
        Array.isArray(parsed.neighbors) &&
        parsed.neighbors.length > 0
      ) {
        return {
          frontierEstimate: Math.round(parsed.frontierEstimate * 100) / 100,
          reasoning: parsed.reasoning || 'Grounded via top-5 semantic ChromaDB neighbors.',
          neighbors: parsed.neighbors.slice(0, 5).map((n) => ({
            title: String(n.title),
            price: Math.round(Number(n.price) * 100) / 100,
            similarity: Math.min(0.99, Math.max(0.75, Number(n.similarity) || 0.9))
          })),
          isLiveGemini: true
        };
      }
      throw new Error('Malformed JSON schema');
    } catch (err) {
      lastError = err;
      if (attempt < delays.length) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
      }
    }
  }

  // Graceful deterministic fallback if API is offline or rate-limited
  const fallbackBase = estimateFallbackPrice(title, description, category);
  return {
    frontierEstimate: fallbackBase,
    reasoning: `Fallback RAG valuation (API unavailable: ${lastError?.message || 'offline'}). Grounded on category priors and specification density.`,
    neighbors: [
      { title: `${title.slice(0, 42)} — Retail Edition`, price: Math.round(fallbackBase * 1.06 * 100) / 100, similarity: 0.962 },
      { title: `Premium ${category} Pro Series Comparable`, price: Math.round(fallbackBase * 1.12 * 100) / 100, similarity: 0.928 },
      { title: `${category} Standard Edition Bundle`, price: Math.round(fallbackBase * 0.94 * 100) / 100, similarity: 0.904 },
      { title: `Previous Generation ${title.split(' ')[0]} Model`, price: Math.round(fallbackBase * 0.86 * 100) / 100, similarity: 0.881 },
      { title: `Certified ${category} Competitor Flagship`, price: Math.round(fallbackBase * 1.03 * 100) / 100, similarity: 0.859 }
    ],
    isLiveGemini: false
  };
}

function estimateFallbackPrice(title, description, category) {
  const lower = `${title} ${description}`.toLowerCase();
  if (lower.includes('mv7')) return 279.0;
  if (lower.includes('xm5') || lower.includes('wh-1000')) return 369.0;
  if (lower.includes('dewalt') && lower.includes('drill')) return 329.0;
  if (lower.includes('macbook') || lower.includes('iphone')) return 999.0;
  if (lower.includes('espresso') || lower.includes('breville')) return 699.0;
  const catBase = {
    Electronics: 289.0,
    Appliances: 349.0,
    Automotive: 199.0,
    'Home & Kitchen': 229.0,
    'Musical Instruments': 269.0,
    'Office Products': 189.0,
    'Tools & Home Improvement': 279.0,
    'Toys & Games': 179.0
  };
  const base = catBase[category] || 249.0;
  const specBoost = (lower.includes('pro') ? 45 : 0) + (lower.includes('brushless') ? 35 : 0) + (lower.includes('wireless') ? 25 : 0);
  return Math.round((base + specBoost) * 100) / 100;
}

// ============================================================================
// 3D INTERACTIVE CHROMADB VECTOR SPACE EXPLORER (HTML5 CANVAS)
// ============================================================================

function VectorSpace3D({ catalog, activeDeal }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0.35, y: 0.65 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const projectedPointsRef = useRef([]);

  // Compute query vector coordinates and nearest catalog indices when a deal is selected
  const queryOverlay = useMemo(() => {
    if (!activeDeal) return null;
    const cat = CATEGORIES.find((c) => c.name === activeDeal.category) || CATEGORIES[0];
    // Deterministic slight offset from category centroid based on deal title
    let hash = 0;
    for (let i = 0; i < activeDeal.title.length; i++) {
      hash = (hash * 31 + activeDeal.title.charCodeAt(i)) % 1000;
    }
    const qx = cat.center[0] + ((hash % 20) - 10) * 0.012;
    const qy = cat.center[1] + (((hash * 7) % 20) - 10) * 0.012;
    const qz = cat.center[2] + (((hash * 13) % 20) - 10) * 0.012;

    // Pick 5 closest catalog points in the same category to represent ChromaDB neighbors
    const sameCat = catalog
      .filter((p) => p.category === cat.name)
      .map((p) => ({
        ...p,
        dist: Math.hypot(p.x - qx, p.y - qy, p.z - qz)
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);

    const neighbors = sameCat.map((pt, idx) => ({
      ...pt,
      ragTitle: activeDeal.neighbors?.[idx]?.title || pt.title,
      ragPrice: activeDeal.neighbors?.[idx]?.price || pt.price,
      similarity: activeDeal.neighbors?.[idx]?.similarity || 0.91 - idx * 0.02
    }));

    return {
      x: qx,
      y: qy,
      z: qz,
      title: activeDeal.title,
      price: activeDeal.ensembleEst,
      neighbors
    };
  }, [activeDeal, catalog]);

  // Smooth auto-rotation loop
  useEffect(() => {
    if (!autoRotate) return;
    let frameId;
    const tick = () => {
      if (!isDraggingRef.current) {
        setRotation((prev) => ({ x: prev.x, y: prev.y + 0.0045 }));
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [autoRotate]);

  // Render 3D scene on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background radial glow
    const grad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width * 0.65);
    grad.addColorStop(0, '#131d33');
    grad.addColorStop(1, '#090e1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    const fov = Math.min(width, height) * 0.95;
    const cameraDist = 2.75;

    const project = (x, y, z) => {
      // Rotate around Y then X
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      const scale = fov / (cameraDist + z2);
      return {
        sx: width / 2 + x1 * scale,
        sy: height / 2 - y2 * scale,
        depth: z2,
        scale
      };
    };

    // Draw subtle 3D coordinate axes
    const origin = project(0, 0, 0);
    const axes = [
      { vec: [1.1, 0, 0], label: 't-SNE X', color: 'rgba(148,163,184,0.22)' },
      { vec: [0, 1.1, 0], label: 't-SNE Y', color: 'rgba(148,163,184,0.22)' },
      { vec: [0, 0, 1.1], label: 't-SNE Z', color: 'rgba(148,163,184,0.22)' }
    ];
    axes.forEach((ax) => {
      const end = project(ax.vec[0], ax.vec[1], ax.vec[2]);
      ctx.beginPath();
      ctx.moveTo(origin.sx, origin.sy);
      ctx.lineTo(end.sx, end.sy);
      ctx.strokeStyle = ax.color;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(148,163,184,0.45)';
      ctx.font = '10px ui-monospace, monospace';
      ctx.fillText(ax.label, end.sx + 4, end.sy + 3);
    });

    // Project all catalog points & depth-sort (painter's algorithm)
    const neighborIds = new Set(queryOverlay ? queryOverlay.neighbors.map((n) => n.id) : []);
    const projected = catalog.map((pt) => {
      const p = project(pt.x, pt.y, pt.z);
      return { ...pt, ...p, isNeighbor: neighborIds.has(pt.id) };
    });
    projected.sort((a, b) => b.depth - a.depth);
    projectedPointsRef.current = projected;

    // Draw catalog points
    projected.forEach((pt) => {
      const alpha = Math.max(0.2, Math.min(0.95, 1 - (pt.depth + 1.2) * 0.28));
      const radius = pt.isNeighbor ? Math.max(4.5, pt.scale * 0.025) : Math.max(2, pt.scale * 0.013);
      ctx.beginPath();
      ctx.arc(pt.sx, pt.sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = pt.isNeighbor ? '#10b981' : pt.color;
      ctx.globalAlpha = pt.isNeighbor ? 1 : queryOverlay ? alpha * 0.45 : alpha;
      ctx.fill();

      if (pt.isNeighbor) {
        ctx.strokeStyle = '#d1fae5';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;

    // Draw query vector & glowing RAG neighbor edges
    if (queryOverlay) {
      const qp = project(queryOverlay.x, queryOverlay.y, queryOverlay.z);

      queryOverlay.neighbors.forEach((nb) => {
        const np = project(nb.x, nb.y, nb.z);
        ctx.beginPath();
        ctx.moveTo(qp.sx, qp.sy);
        ctx.lineTo(np.sx, np.sy);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.72)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Midpoint similarity badge
        const mx = (qp.sx + np.sx) / 2;
        const my = (qp.sy + np.sy) / 2;
        ctx.fillStyle = 'rgba(6, 78, 59, 0.85)';
        ctx.fillRect(mx - 18, my - 7, 36, 14);
        ctx.fillStyle = '#6ee7b7';
        ctx.font = '9px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(nb.similarity.toFixed(2), mx, my + 3);
        ctx.textAlign = 'left';
      });

      // Outer halo for query vector
      ctx.beginPath();
      ctx.arc(qp.sx, qp.sy, 11, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fill();

      // Query vector core diamond/dot
      ctx.beginPath();
      ctx.arc(qp.sx, qp.sy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText('QUERY VECTOR', qp.sx + 10, qp.sy - 6);
    }
  }, [catalog, rotation, queryOverlay]);

  // Pointer drag + hover interaction
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastMouseRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (isDraggingRef.current) {
      const dx = clientX - lastMouseRef.current.x;
      const dy = clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: clientX, y: clientY };
      setRotation((prev) => ({
        x: Math.max(-1.4, Math.min(1.4, prev.x + dy * 0.008)),
        y: prev.y + dx * 0.008
      }));
      return;
    }

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    let closest = null;
    let minD = 14;
    for (const pt of projectedPointsRef.current) {
      const d = Math.hypot(pt.sx - mx, pt.sy - my);
      if (d < minD) {
        minD = d;
        closest = pt;
      }
    }
    setHoveredPoint(
      closest
        ? { ...closest, mx, my, containerWidth: containerRef.current?.clientWidth || 300 }
        : null
    );
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">ChromaDB 3D t-SNE Vector Space</h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            400K Amazon Index
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRotate((v) => !v)}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
          >
            {autoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {autoRotate ? 'Pause Spin' : 'Auto-Spin'}
          </button>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Drag to orbit</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[300px] sm:h-[340px] rounded-xl overflow-hidden border border-slate-800 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => {
          handlePointerUp();
          setHoveredPoint(null);
        }}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-20 max-w-[220px] px-3 py-2 rounded-lg bg-slate-950/95 border border-slate-700 shadow-xl text-xs"
            style={{
              left: Math.min(hoveredPoint.mx + 12, hoveredPoint.containerWidth - 230),
              top: Math.max(8, hoveredPoint.my - 52)
            }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hoveredPoint.color }} />
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                {hoveredPoint.category}
              </span>
            </div>
            <div className="text-slate-100 font-medium line-clamp-2">{hoveredPoint.title}</div>
            <div className="text-emerald-400 font-mono mt-1">Catalog Price: ${hoveredPoint.price.toFixed(2)}</div>
          </div>
        )}

        {/* Active Query Indicator Overlay */}
        {activeDeal && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto sm:max-w-xs bg-slate-950/85 backdrop-blur-md border border-emerald-500/35 rounded-lg px-3 py-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RAG Retrieval Active (Top-5 Cosine Neighbors)</span>
            </div>
            <div className="text-slate-200 truncate mt-0.5">{activeDeal.title}</div>
          </div>
        )}
      </div>

      {/* Category Legend */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {CATEGORIES.map((cat) => (
          <div key={cat.name} className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
            <span>{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Core Data State
  const [deals, setDeals] = useState(INITIAL_DEALS);
  const [logs, setLogs] = useState(() => [
    {
      id: 'log-boot-1',
      time: formatTime(new Date(Date.now() - 1000 * 60 * 15)),
      agent: 'PlanningAgent',
      message: 'Initialized Autonomous Multi-Agent Framework. Loaded 2 deals from memory.json.'
    },
    {
      id: 'log-boot-2',
      time: formatTime(new Date(Date.now() - 1000 * 60 * 14)),
      agent: 'FrontierAgent',
      message: 'Connected to persistent ChromaDB vectorstore (400,000 Amazon embeddings, all-MiniLM-L6-v2).'
    },
    {
      id: 'log-boot-3',
      time: formatTime(new Date(Date.now() - 1000 * 60 * 6)),
      agent: 'MessengerAgent',
      message: 'Dispatched Pushover alert for Breville Barista Express ($147.68 verified discount).'
    }
  ]);
  const [notifications, setNotifications] = useState(() =>
    INITIAL_DEALS.map((d) => ({
      id: `notif-${d.id}`,
      dealId: d.id,
      title: d.title,
      dealPrice: d.dealPrice,
      ensembleEst: d.ensembleEst,
      discount: d.discount,
      url: d.url,
      timestamp: d.timestamp
    }))
  );

  // Operational & Control State
  const [systemStatus, setSystemStatus] = useState('Idle'); // Idle | Scanning | Evaluating | Alert Sent
  const [threshold, setThreshold] = useState(50);
  const [autoScan, setAutoScan] = useState(false);
  const [timerMode, setTimerMode] = useState('15s'); // '15s' | '5m'
  const [countdown, setCountdown] = useState(15);
  const [isRunning, setIsRunning] = useState(false);
  const [rssCursor, setRssCursor] = useState(0);
  const [cycleCount, setCycleCount] = useState(2);

  // Pipeline Live Node State
  const [activeAgents, setActiveAgents] = useState([]);
  const [pipelineMetrics, setPipelineMetrics] = useState({
    currentTitle: INITIAL_DEALS[1].title,
    scannerLatency: '2.4s',
    specialistEst: INITIAL_DEALS[1].specialistEst,
    specialistLatency: '0.84s',
    frontierEst: INITIAL_DEALS[1].frontierEst,
    frontierLatency: '1.12s',
    rfEst: INITIAL_DEALS[1].rfEst,
    rfLatency: '0.05s',
    ensembleEst: INITIAL_DEALS[1].ensembleEst,
    ensembleLatency: '0.02s',
    messengerStatus: 'Dispatched'
  });

  // UI Navigation, Sorting & Drawers
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | sandbox
  const [selectedDeal, setSelectedDeal] = useState(INITIAL_DEALS[1]);
  const [inspectModalDeal, setInspectModalDeal] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('alerts'); // alerts | memory
  const [sortConfig, setSortConfig] = useState({ key: 'discount', dir: 'desc' });
  const [toastAlert, setToastAlert] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Custom Sandbox Form State
  const [customTitle, setCustomTitle] = useState(SANDBOX_PRESETS[0].title);
  const [customDesc, setCustomDesc] = useState(SANDBOX_PRESETS[0].description);
  const [customCategory, setCustomCategory] = useState(SANDBOX_PRESETS[0].category);
  const [customPrice, setCustomPrice] = useState(String(SANDBOX_PRESETS[0].dealPrice));
  const [sandboxStatus, setSandboxStatus] = useState('');

  const terminalEndRef = useRef(null);
  const catalog = useMemo(() => generateVectorCatalog(), []);

  // Auto-scroll terminal when new logs arrive
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const appendLog = useCallback((agent, message) => {
    setLogs((prev) => [
      ...prev.slice(-120),
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: formatTime(new Date()),
        agent,
        message
      }
    ]);
  }, []);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Trigger Pushover mobile toast
  const triggerPushoverToast = useCallback((notif) => {
    setToastAlert(notif);
    setTimeout(() => {
      setToastAlert((curr) => (curr?.id === notif.id ? null : curr));
    }, 6000);
  }, []);

  // ============================================================================
  // AUTONOMOUS MULTI-AGENT CYCLE EXECUTION
  // ============================================================================

  const runAutonomousCycle = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setSystemStatus('Scanning');
    setActiveAgents(['PlanningAgent']);

    appendLog('PlanningAgent', '--- Starting Scheduled Autonomous Deal-Hunting Cycle ---');
    appendLog('PlanningAgent', `Active discount threshold: $${threshold.toFixed(2)} | Seen memory entries: ${deals.length}`);
    await sleep(450);

    // Pick next unseen deal from RSS pool
    const seenUrls = new Set(deals.map((d) => d.url));
    let candidate = null;
    let nextCursor = rssCursor;

    for (let i = 0; i < RSS_FEED_POOL.length; i++) {
      const idx = (rssCursor + i) % RSS_FEED_POOL.length;
      if (!seenUrls.has(RSS_FEED_POOL[idx].url)) {
        candidate = RSS_FEED_POOL[idx];
        nextCursor = (idx + 1) % RSS_FEED_POOL.length;
        break;
      }
    }

    setActiveAgents(['ScannerAgent']);
    appendLog('ScannerAgent', 'Fetching live DealNews RSS feeds (electronics, computers, home-garden, tools)...');
    await sleep(600);

    if (!candidate) {
      appendLog('ScannerAgent', 'All 8 RSS feed items already present in memory.json. Skipping duplicate evaluation.');
      appendLog('PlanningAgent', 'Cycle complete (0 new unseen deals). Reset memory.json or use Custom Sandbox to test new items.');
      setActiveAgents([]);
      setSystemStatus('Idle');
      setIsRunning(false);
      return;
    }

    setRssCursor(nextCursor);
    const scannerLat = (1.8 + Math.random() * 0.9).toFixed(2);
    appendLog(
      'ScannerAgent',
      `Parsed & validated via Pydantic DealSelection schema (${scannerLat}s): "${candidate.title}" listed at $${candidate.dealPrice.toFixed(2)}`
    );

    setPipelineMetrics({
      currentTitle: candidate.title,
      scannerLatency: `${scannerLat}s`,
      specialistEst: null,
      specialistLatency: '...',
      frontierEst: null,
      frontierLatency: '...',
      rfEst: null,
      rfLatency: '...',
      ensembleEst: null,
      ensembleLatency: '...',
      messengerStatus: 'Pending'
    });

    // Parallel Fan-Out: Specialist + Frontier + RandomForest
    setSystemStatus('Evaluating');
    setActiveAgents(['SpecialistAgent', 'FrontierAgent', 'RandomForestAgent']);

    appendLog('SpecialistAgent', 'Invoking Modal.com serverless T4 RPC endpoint (QLoRA Llama-3.1-8B-Instruct, 4-bit NF4)...');
    appendLog('FrontierAgent', `Embedding query & executing ChromaDB cosine similarity search (top_k=5, category="${candidate.category}")...`);
    appendLog('RandomForestAgent', 'Running local Scikit-Learn RandomForestRegressor (joblib) inference...');

    await sleep(500);
    const rfLat = (0.03 + Math.random() * 0.03).toFixed(2);
    appendLog('RandomForestAgent', `Statistical estimate completed in ${rfLat}s -> $${candidate.rfEst.toFixed(2)}`);
    setPipelineMetrics((m) => ({ ...m, rfEst: candidate.rfEst, rfLatency: `${rfLat}s` }));

    await sleep(550);
    const specLat = (0.72 + Math.random() * 0.25).toFixed(2);
    appendLog('SpecialistAgent', `Modal T4 RPC returned logit-weighted price in ${specLat}s -> $${candidate.specialistEst.toFixed(2)}`);
    setPipelineMetrics((m) => ({ ...m, specialistEst: candidate.specialistEst, specialistLatency: `${specLat}s` }));

    await sleep(550);
    const frontLat = (0.98 + Math.random() * 0.35).toFixed(2);
    const topNb = candidate.neighbors[0];
    appendLog(
      'FrontierAgent',
      `Retrieved 5 ChromaDB neighbors (top match: "${topNb.title}" @ $${topNb.price.toFixed(2)}, cos=${topNb.similarity.toFixed(3)}).`
    );
    appendLog('FrontierAgent', `RAG-grounded LLM estimate completed in ${frontLat}s -> $${candidate.frontierEst.toFixed(2)}`);
    setPipelineMetrics((m) => ({ ...m, frontierEst: candidate.frontierEst, frontierLatency: `${frontLat}s` }));

    // Ensemble Stage
    setActiveAgents(['EnsembleAgent']);
    await sleep(450);
    const ensembleEst = computeEnsemble(candidate.frontierEst, candidate.specialistEst, candidate.rfEst);
    const discount = Math.round((ensembleEst - candidate.dealPrice) * 100) / 100;
    const discountPct = Math.round((discount / ensembleEst) * 1000) / 10;

    appendLog(
      'EnsembleAgent',
      `Ridge meta-blend (0.45*Frontier + 0.40*Specialist + 0.15*RF) -> $${ensembleEst.toFixed(2)} | Discount: $${discount.toFixed(2)} (${discountPct}%)`
    );
    setPipelineMetrics((m) => ({ ...m, ensembleEst, ensembleLatency: '0.02s' }));

    const isBargain = discount >= threshold;
    const newDeal = {
      id: `deal-${Date.now()}`,
      title: candidate.title,
      description: candidate.description,
      category: candidate.category,
      url: candidate.url,
      dealPrice: candidate.dealPrice,
      specialistEst: candidate.specialistEst,
      frontierEst: candidate.frontierEst,
      rfEst: candidate.rfEst,
      ensembleEst,
      discount,
      discountPct,
      latencies: {
        scanner: Number(scannerLat),
        specialist: Number(specLat),
        frontier: Number(frontLat),
        rf: Number(rfLat),
        ensemble: 0.02
      },
      status: isBargain ? 'Alert Sent' : 'Passed',
      timestamp: new Date().toISOString(),
      source: 'DealNews RSS',
      neighbors: candidate.neighbors
    };

    // Messenger Stage
    if (isBargain) {
      setSystemStatus('Alert Sent');
      setActiveAgents(['MessengerAgent']);
      await sleep(450);
      appendLog(
        'MessengerAgent',
        `BARGAIN VERIFIED (+$${discount.toFixed(2)} >= $${threshold})! Dispatching Pushover mobile alert...`
      );
      setPipelineMetrics((m) => ({ ...m, messengerStatus: 'Alert Sent' }));

      const notif = {
        id: `notif-${newDeal.id}`,
        dealId: newDeal.id,
        title: newDeal.title,
        dealPrice: newDeal.dealPrice,
        ensembleEst: newDeal.ensembleEst,
        discount: newDeal.discount,
        url: newDeal.url,
        timestamp: newDeal.timestamp
      };
      setNotifications((prev) => [notif, ...prev]);
      triggerPushoverToast(notif);
    } else {
      setActiveAgents(['PlanningAgent']);
      await sleep(300);
      appendLog(
        'PlanningAgent',
        `Discount $${discount.toFixed(2)} is below alert threshold ($${threshold}). Logged to memory.json without alert.`
      );
      setPipelineMetrics((m) => ({ ...m, messengerStatus: 'Below Threshold' }));
    }

    setDeals((prev) => [newDeal, ...prev]);
    setSelectedDeal(newDeal);
    setCycleCount((c) => c + 1);

    await sleep(600);
    setActiveAgents([]);
    setSystemStatus(isBargain ? 'Alert Sent' : 'Idle');
    setIsRunning(false);
  }, [isRunning, threshold, deals, rssCursor, appendLog, triggerPushoverToast]);

  // ============================================================================
  // LIVE GEMINI-POWERED CUSTOM DEAL SANDBOX EXECUTION
  // ============================================================================

  const handleRunCustomDeal = async (e) => {
    e.preventDefault();
    if (isRunning) return;
    const numericPrice = parseFloat(customPrice);
    if (!customTitle.trim() || isNaN(numericPrice) || numericPrice <= 0) {
      setSandboxStatus('Please enter a valid product title and positive deal price.');
      return;
    }

    setIsRunning(true);
    setSandboxStatus('Orchestrating multi-agent pipeline with live Gemini FrontierAgent...');
    setSystemStatus('Evaluating');
    setActiveAgents(['PlanningAgent']);

    appendLog('PlanningAgent', `--- Custom Sandbox Evaluation Initiated: "${customTitle.trim()}" ($${numericPrice.toFixed(2)}) ---`);
    await sleep(300);

    setActiveAgents(['ScannerAgent']);
    appendLog('ScannerAgent', 'Validated user-submitted deal payload via Pydantic Deal schema (0.05s).');

    setPipelineMetrics({
      currentTitle: customTitle.trim(),
      scannerLatency: '0.05s',
      specialistEst: null,
      specialistLatency: '...',
      frontierEst: null,
      frontierLatency: '...',
      rfEst: null,
      rfLatency: '...',
      ensembleEst: null,
      ensembleLatency: '...',
      messengerStatus: 'Pending'
    });

    await sleep(300);
    setActiveAgents(['SpecialistAgent', 'FrontierAgent', 'RandomForestAgent']);
    appendLog('FrontierAgent', 'Calling live Gemini API (gemini-3-flash-preview) for RAG neighbor synthesis & market valuation...');
    appendLog('SpecialistAgent', 'Dispatching description to Modal.com QLoRA Llama-3.1-8B endpoint...');
    appendLog('RandomForestAgent', 'Vectorizing text features for Scikit-Learn RandomForestRegressor...');

    const t0 = performance.now();
    const geminiResult = await callGeminiFrontierAgent(customTitle.trim(), customDesc.trim(), customCategory);
    const frontLat = ((performance.now() - t0) / 1000).toFixed(2);

    const frontierEst = geminiResult.frontierEstimate;
    // Derive realistic correlated Specialist (QLoRA) and RandomForest estimates around the grounded value
    const specialistEst = Math.round(frontierEst * (0.94 + Math.random() * 0.08) * 100) / 100;
    const rfEst = Math.round(frontierEst * (0.86 + Math.random() * 0.14) * 100) / 100;
    const specLat = (0.76 + Math.random() * 0.22).toFixed(2);
    const rfLat = '0.04';

    appendLog('RandomForestAgent', `Statistical estimate completed in ${rfLat}s -> $${rfEst.toFixed(2)}`);
    appendLog('SpecialistAgent', `QLoRA Llama-3.1-8B estimate completed in ${specLat}s -> $${specialistEst.toFixed(2)}`);
    appendLog(
      'FrontierAgent',
      `${geminiResult.isLiveGemini ? 'Live Gemini API' : 'Fallback RAG'} returned 5 neighbors in ${frontLat}s -> $${frontierEst.toFixed(2)}`
    );

    setPipelineMetrics((m) => ({
      ...m,
      rfEst,
      rfLatency: `${rfLat}s`,
      specialistEst,
      specialistLatency: `${specLat}s`,
      frontierEst,
      frontierLatency: `${frontLat}s`
    }));

    setActiveAgents(['EnsembleAgent']);
    await sleep(400);
    const ensembleEst = computeEnsemble(frontierEst, specialistEst, rfEst);
    const discount = Math.round((ensembleEst - numericPrice) * 100) / 100;
    const discountPct = Math.round((discount / ensembleEst) * 1000) / 10;

    appendLog(
      'EnsembleAgent',
      `Ridge meta-blend -> $${ensembleEst.toFixed(2)} | Net Discount: $${discount.toFixed(2)} (${discountPct}%)`
    );
    setPipelineMetrics((m) => ({ ...m, ensembleEst, ensembleLatency: '0.02s' }));

    const isBargain = discount >= threshold;
    const newDeal = {
      id: `deal-custom-${Date.now()}`,
      title: customTitle.trim(),
      description: customDesc.trim() || 'Custom user-submitted product description.',
      category: customCategory,
      url: `https://dealnews.com/custom/${encodeURIComponent(customTitle.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 36))}`,
      dealPrice: numericPrice,
      specialistEst,
      frontierEst,
      rfEst,
      ensembleEst,
      discount,
      discountPct,
      latencies: {
        scanner: 0.05,
        specialist: Number(specLat),
        frontier: Number(frontLat),
        rf: 0.04,
        ensemble: 0.02
      },
      status: isBargain ? 'Alert Sent' : 'Passed',
      timestamp: new Date().toISOString(),
      source: geminiResult.isLiveGemini ? 'Gemini Sandbox' : 'Local Sandbox',
      reasoning: geminiResult.reasoning,
      neighbors: geminiResult.neighbors
    };

    if (isBargain) {
      setSystemStatus('Alert Sent');
      setActiveAgents(['MessengerAgent']);
      await sleep(350);
      appendLog('MessengerAgent', `BARGAIN ALERT (+$${discount.toFixed(2)})! Pushover mobile notification dispatched.`);
      setPipelineMetrics((m) => ({ ...m, messengerStatus: 'Alert Sent' }));

      const notif = {
        id: `notif-${newDeal.id}`,
        dealId: newDeal.id,
        title: newDeal.title,
        dealPrice: newDeal.dealPrice,
        ensembleEst: newDeal.ensembleEst,
        discount: newDeal.discount,
        url: newDeal.url,
        timestamp: newDeal.timestamp
      };
      setNotifications((prev) => [notif, ...prev]);
      triggerPushoverToast(notif);
    } else {
      appendLog('PlanningAgent', `Discount $${discount.toFixed(2)} below $${threshold} threshold. Stored in memory.json.`);
      setPipelineMetrics((m) => ({ ...m, messengerStatus: 'Below Threshold' }));
    }

    setDeals((prev) => [newDeal, ...prev]);
    setSelectedDeal(newDeal);
    setCycleCount((c) => c + 1);
    setSandboxStatus(
      `Evaluation complete! Ensemble Estimate: $${ensembleEst.toFixed(2)} (${
        isBargain ? `+$${discount.toFixed(2)} Bargain — Alert Sent` : `$${discount.toFixed(2)} — Passed`
      }).`
    );

    await sleep(500);
    setActiveAgents([]);
    setSystemStatus(isBargain ? 'Alert Sent' : 'Idle');
    setIsRunning(false);
  };

  // Auto-Scan Timer Effect
  useEffect(() => {
    if (!autoScan) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (!isRunning) {
            runAutonomousCycle();
          }
          return timerMode === '15s' ? 15 : 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoScan, timerMode, isRunning, runAutonomousCycle]);

  // Reset memory.json
  const handleResetMemory = () => {
    if (isRunning) return;
    setDeals([]);
    setNotifications([]);
    setSelectedDeal(null);
    setRssCursor(0);
    setCycleCount(0);
    setSystemStatus('Idle');
    setPipelineMetrics({
      currentTitle: 'Waiting for next autonomous cycle...',
      scannerLatency: '--',
      specialistEst: null,
      specialistLatency: '--',
      frontierEst: null,
      frontierLatency: '--',
      rfEst: null,
      rfLatency: '--',
      ensembleEst: null,
      ensembleLatency: '--',
      messengerStatus: 'Idle'
    });
    appendLog('PlanningAgent', 'memory.json cleared. Deduplication cache reset to 0 entries.');
  };

  // Sorting Logic for Opportunities Table
  const sortedDeals = useMemo(() => {
    const copy = [...deals];
    copy.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === 'string') {
        return sortConfig.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortConfig.dir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return copy;
  }, [deals, sortConfig]);

  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc'
    }));
  };

  // KPI Metrics
  const kpis = useMemo(() => {
    const total = deals.length;
    const bargains = deals.filter((d) => d.status === 'Alert Sent').length;
    const avgDiscount = total > 0 ? deals.reduce((acc, d) => acc + d.discount, 0) / total : 0;
    const estCost = (cycleCount * 0.0011).toFixed(4);
    return { total, bargains, avgDiscount, estCost };
  }, [deals, cycleCount]);

  // Formatted memory.json representation
  const memoryJsonString = useMemo(() => {
    const payload = deals.map((d) => ({
      deal: {
        product_description: d.title,
        price: d.dealPrice,
        url: d.url
      },
      estimate: d.ensembleEst,
      discount: d.discount,
      alert_dispatched: d.status === 'Alert Sent',
      evaluated_at: d.timestamp
    }));
    return JSON.stringify(payload, null, 2);
  }, [deals]);

  const handleCopyMemory = () => {
    navigator.clipboard?.writeText(memoryJsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  };

  // Helper to render a pipeline node
  const renderAgentNode = (agentKey, subtitle, valueText, latencyText) => {
    const agent = AGENTS[agentKey];
    const isActive = activeAgents.includes(agentKey);
    return (
      <div
        className={`relative rounded-xl p-3 border transition-all duration-300 ${
          isActive
            ? `${agent.bg} ${agent.border} ring-2 ${agent.ring} shadow-lg scale-[1.02]`
            : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
        }`}
      >
        {isActive && (
          <span
            className="absolute -top-1.5 -right-1.5 flex h-3 w-3"
            aria-hidden="true"
          >
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: agent.color }}
            />
            <span
              className="relative inline-flex rounded-full h-3 w-3"
              style={{ backgroundColor: agent.color }}
            />
          </span>
        )}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`text-xs font-bold tracking-tight ${agent.text}`}>{agent.label}</span>
          {latencyText && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800">
              {latencyText}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 truncate">{subtitle}</div>
        {valueText && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase">Output</span>
            <span className="text-xs font-mono font-semibold text-slate-100">{valueText}</span>
          </div>
        )}
      </div>
    );
  };

  const statusBadgeStyles = {
    Idle: 'bg-slate-800 text-slate-300 border-slate-700',
    Scanning: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    Evaluating: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
    'Alert Sent': 'bg-rose-500/15 text-rose-300 border-rose-500/40'
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #0b1120; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 9999px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>

      {/* ====================================================================
          TOP HEADER BAR
      ==================================================================== */}
      <header className="sticky top-0 z-30 bg-[#0b1120]/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Brand & Live Status */}
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 shrink-0">
                <div className="w-full h-full rounded-[11px] bg-[#0b1120] flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    The Price is Right
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusBadgeStyles[systemStatus]}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        systemStatus === 'Idle'
                          ? 'bg-slate-400'
                          : systemStatus === 'Alert Sent'
                          ? 'bg-rose-400 animate-pulse'
                          : 'bg-cyan-400 animate-ping'
                      }`}
                    />
                    {systemStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Autonomous Multi-Agent Deal-Hunting Framework · Week 8 Capstone
                </p>
              </div>
            </div>

            {/* Primary Control Cluster */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Primary Run Button */}
              <button
                onClick={runAutonomousCycle}
                disabled={isRunning}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-lg ${
                  isRunning
                    ? 'bg-indigo-600/40 text-indigo-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-500/25'
                }`}
              >
                {isRunning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{isRunning ? 'Agents Running...' : 'Run Autonomous Cycle'}</span>
              </button>

              {/* Auto-Scan Timer Toggle + Mode Selector */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setAutoScan((v) => !v)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                    autoScan
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{autoScan ? `Auto: ${countdown}s` : 'Auto-Scan'}</span>
                </button>
                <select
                  value={timerMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    setTimerMode(mode);
                    setCountdown(mode === '15s' ? 15 : 300);
                  }}
                  aria-label="Auto-scan interval"
                  className="bg-slate-950 text-slate-300 text-[11px] rounded px-1.5 py-1 border border-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="15s">15s Demo</option>
                  <option value="5m">5m Prod</option>
                </select>
              </div>

              {/* Discount Alert Threshold Slider */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-[11px] text-slate-400 whitespace-nowrap">Alert ≥</span>
                <input
                  type="range"
                  min={20}
                  max={200}
                  step={5}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-20 accent-rose-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-rose-400 w-10 text-right">
                  ${threshold}
                </span>
              </div>

              {/* Drawer Trigger (Pushover + memory.json) */}
              <button
                onClick={() => {
                  setDrawerTab('alerts');
                  setDrawerOpen(true);
                }}
                className="relative px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition"
              >
                <Bell className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Alerts & Memory</span>
                {notifications.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Reset memory.json */}
              <button
                onClick={handleResetMemory}
                disabled={isRunning}
                title="Reset memory.json"
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset memory.json</span>
              </button>
            </div>
          </div>

          {/* KPI Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-3.5">
            <div className="bg-[#111827]/90 border border-slate-800/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Deals Evaluated</div>
                <div className="text-lg font-bold font-mono text-white">{kpis.total}</div>
              </div>
              <Activity className="w-4 h-4 text-cyan-400 opacity-80" />
            </div>

            <div className="bg-[#111827]/90 border border-slate-800/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Verified Bargains</div>
                <div className="text-lg font-bold font-mono text-rose-400">{kpis.bargains}</div>
              </div>
              <Zap className="w-4 h-4 text-rose-400 opacity-80" />
            </div>

            <div className="bg-[#111827]/90 border border-slate-800/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Avg Ensemble Discount</div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  ${kpis.avgDiscount.toFixed(2)}
                </div>
              </div>
              <DollarSign className="w-4 h-4 text-emerald-400 opacity-80" />
            </div>

            <div className="bg-[#111827]/90 border border-slate-800/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Est. Session Cost</div>
                <div className="text-lg font-bold font-mono text-blue-400">
                  ${kpis.estCost}{' '}
                  <span className="text-[10px] font-normal text-slate-500">(&lt;$0.005/cyc)</span>
                </div>
              </div>
              <Cpu className="w-4 h-4 text-blue-400 opacity-80" />
            </div>

            <div className="col-span-2 sm:col-span-1 bg-[#111827]/90 border border-slate-800/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Active memory.json</div>
                <div className="text-lg font-bold font-mono text-indigo-400">{deals.length} keys</div>
              </div>
              <Database className="w-4 h-4 text-indigo-400 opacity-80" />
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          MAIN CONTENT CONTAINER
      ==================================================================== */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* SECTION 1: MULTI-AGENT PIPELINE VISUALIZER */}
        <section className="bg-[#111827]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">
                Live Multi-Agent Orchestration Pipeline
              </h2>
            </div>
            <div className="text-xs text-slate-400 truncate max-w-xl">
              Active Target:{' '}
              <span className="text-slate-200 font-medium">{pipelineMetrics.currentTitle}</span>
            </div>
          </div>

          {/* 5-Stage Horizontal Flow (Responsive Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            {/* Stage 1: PlanningAgent */}
            <div className="md:col-span-2">
              {renderAgentNode(
                'PlanningAgent',
                'Orchestrator & Memory',
                `${deals.length} tracked`,
                '0.01s'
              )}
            </div>

            {/* Stage 2: ScannerAgent */}
            <div className="md:col-span-2">
              {renderAgentNode(
                'ScannerAgent',
                'DealNews RSS + Pydantic',
                'Top Deal',
                pipelineMetrics.scannerLatency
              )}
            </div>

            {/* Stage 3: Parallel Fan-Out (3 Estimator Agents) */}
            <div className="md:col-span-3 space-y-2 relative">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-1 flex items-center justify-between">
                <span>Parallel Inference Fan-Out</span>
                <span className="text-slate-600">3 Heterogenous Models</span>
              </div>
              {renderAgentNode(
                'SpecialistAgent',
                'QLoRA Llama-3.1-8B (Modal T4)',
                pipelineMetrics.specialistEst ? `$${pipelineMetrics.specialistEst.toFixed(2)}` : '--',
                pipelineMetrics.specialistLatency
              )}
              {renderAgentNode(
                'FrontierAgent',
                'ChromaDB RAG + LLM',
                pipelineMetrics.frontierEst ? `$${pipelineMetrics.frontierEst.toFixed(2)}` : '--',
                pipelineMetrics.frontierLatency
              )}
              {renderAgentNode(
                'RandomForestAgent',
                'Scikit-Learn Regressor',
                pipelineMetrics.rfEst ? `$${pipelineMetrics.rfEst.toFixed(2)}` : '--',
                pipelineMetrics.rfLatency
              )}
            </div>

            {/* Stage 4: EnsembleAgent */}
            <div className="md:col-span-2">
              {renderAgentNode(
                'EnsembleAgent',
                'Ridge Meta-Regressor',
                pipelineMetrics.ensembleEst ? `$${pipelineMetrics.ensembleEst.toFixed(2)}` : '--',
                pipelineMetrics.ensembleLatency
              )}
            </div>

            {/* Stage 5: MessengerAgent */}
            <div className="md:col-span-2">
              {renderAgentNode(
                'MessengerAgent',
                'Pushover Mobile Alert',
                pipelineMetrics.messengerStatus,
                '0.30s'
              )}
            </div>
          </div>
        </section>

        {/* VIEW MODE TABS (Operations Dashboard vs Live Gemini Sandbox) */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition ${
              activeTab === 'dashboard'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Live Opportunities & Telemetry</span>
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2 transition ${
              activeTab === 'sandbox'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Test Custom Deal (Live Gemini Sandbox)</span>
          </button>
        </div>

        {/* ====================================================================
            TAB A: OPERATIONS DASHBOARD (Opportunities Table + Terminal + 3D Plot)
        ==================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* LIVE OPPORTUNITIES DATAFRAME */}
            <section className="bg-[#111827]/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-white">Live Opportunities Dataframe</h2>
                  <span className="text-[11px] text-slate-400">
                    (Click any row to project into 3D ChromaDB space)
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {sortedDeals.length} records deduplicated
                </span>
              </div>

              <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left border-collapse min-w-[920px]">
                  <thead>
                    <tr className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <th className="py-3 px-4 font-semibold">
                        <button
                          onClick={() => toggleSort('title')}
                          className="flex items-center gap-1 hover:text-white"
                        >
                          Product & Category <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-3 font-semibold text-right">
                        <button
                          onClick={() => toggleSort('dealPrice')}
                          className="inline-flex items-center gap-1 hover:text-white"
                        >
                          Deal Price <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-3 font-semibold text-right text-purple-400">
                        Specialist (QLoRA)
                      </th>
                      <th className="py-3 px-3 font-semibold text-right text-emerald-400">
                        Frontier (RAG)
                      </th>
                      <th className="py-3 px-3 font-semibold text-right text-amber-400">
                        RF Est.
                      </th>
                      <th className="py-3 px-3 font-semibold text-right text-blue-400">
                        <button
                          onClick={() => toggleSort('ensembleEst')}
                          className="inline-flex items-center gap-1 hover:text-blue-300"
                        >
                          Ensemble Est. <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-3 font-semibold text-right">
                        <button
                          onClick={() => toggleSort('discount')}
                          className="inline-flex items-center gap-1 hover:text-white"
                        >
                          Discount <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="py-3 px-4 font-semibold text-right">Status & Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-xs">
                    {sortedDeals.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          memory.json is empty. Click{' '}
                          <span className="text-indigo-400 font-semibold">Run Autonomous Cycle</span>{' '}
                          or test a product in the Gemini Sandbox.
                        </td>
                      </tr>
                    ) : (
                      sortedDeals.map((deal) => {
                        const isSelected = selectedDeal?.id === deal.id;
                        const isAlert = deal.status === 'Alert Sent';
                        return (
                          <tr
                            key={deal.id}
                            onClick={() => setSelectedDeal(deal)}
                            className={`cursor-pointer transition ${
                              isSelected
                                ? 'bg-indigo-500/10'
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-medium text-slate-100 truncate">{deal.title}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {deal.category}
                                </span>
                                <span className="text-[10px] text-slate-500">{deal.source}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                              ${deal.dealPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-purple-300">
                              ${deal.specialistEst.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-300">
                              ${deal.frontierEst.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-amber-300">
                              ${deal.rfEst.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-blue-300">
                              ${deal.ensembleEst.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono">
                              <div
                                className={`font-bold ${
                                  deal.discount >= threshold ? 'text-emerald-400' : 'text-slate-400'
                                }`}
                              >
                                {deal.discount >= 0 ? '+' : ''}${deal.discount.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-500">{deal.discountPct}% off</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                {isAlert ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/35">
                                    <CheckCircle2 className="w-3 h-3" /> Alert Sent
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                    <XCircle className="w-3 h-3" /> Passed
                                  </span>
                                )}
                                <button
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    setInspectModalDeal(deal);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
                                  title="Inspect Agent Breakdown & RAG Neighbors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* BOTTOM SPLIT: STREAMING AGENT TERMINAL + 3D VECTOR SPACE EXPLORER */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              {/* Streaming Terminal */}
              <section className="xl:col-span-6 bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 flex flex-col shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-slate-100">
                      Real-Time Agent Activity Stream
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  </div>
                </div>

                <div className="flex-1 h-[340px] overflow-y-auto custom-scroll bg-[#070b14] rounded-xl p-3.5 border border-slate-800/80 font-mono text-[11.5px] leading-relaxed space-y-1.5">
                  {logs.map((entry) => {
                    const agentStyle = AGENTS[entry.agent] || AGENTS.PlanningAgent;
                    return (
                      <div key={entry.id} className="break-words">
                        <span className="text-slate-600 mr-2">[{entry.time}]</span>
                        <span className={`font-bold mr-2 ${agentStyle.ansi}`}>[{entry.agent}]</span>
                        <span className="text-slate-300">{entry.message}</span>
                      </div>
                    );
                  })}
                  <div ref={terminalEndRef} />
                </div>
              </section>

              {/* 3D ChromaDB Vector Space */}
              <section className="xl:col-span-6 bg-[#111827]/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
                <VectorSpace3D catalog={catalog} activeDeal={selectedDeal} />
              </section>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB B: TEST CUSTOM DEAL (LIVE GEMINI-POWERED SANDBOX)
        ==================================================================== */}
        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <section className="lg:col-span-6 bg-[#111827]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Custom Deal Multi-Agent Sandbox
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Powered by live Gemini API acting as FrontierAgent + full 7-agent orchestration
                  </p>
                </div>
              </div>

              {/* One-Click Presets */}
              <div className="mb-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  One-Click Benchmark Presets
                </div>
                <div className="flex flex-wrap gap-2">
                  {SANDBOX_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setCustomTitle(preset.title);
                        setCustomDesc(preset.description);
                        setCustomCategory(preset.category);
                        setCustomPrice(String(preset.dealPrice));
                        setSandboxStatus('');
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition"
                    >
                      {preset.label} (${preset.dealPrice})
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleRunCustomDeal} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Shure MV7+ Podcast Dynamic Microphone"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Product Category
                    </label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Listed Deal Price ($ USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Product Specifications & Description
                  </label>
                  <textarea
                    rows={4}
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="Paste technical specs, condition, accessories, or brand details..."
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {sandboxStatus && (
                  <div className="text-xs px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    {sandboxStatus}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRunning}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isRunning ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>
                    {isRunning
                      ? 'Evaluating across 7-Agent Ensemble...'
                      : 'Evaluate Deal via Live Multi-Agent Pipeline'}
                  </span>
                </button>
              </form>
            </section>

            {/* Live Terminal Mirror alongside Sandbox */}
            <section className="lg:col-span-6 bg-[#0d1322] border border-slate-800/90 rounded-2xl p-4 flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    Live Execution Trace (Gemini + Ensemble)
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  View in Table <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 min-h-[340px] max-h-[420px] overflow-y-auto custom-scroll bg-[#070b14] rounded-xl p-3.5 border border-slate-800/80 font-mono text-[11.5px] leading-relaxed space-y-1.5">
                {logs.map((entry) => {
                  const agentStyle = AGENTS[entry.agent] || AGENTS.PlanningAgent;
                  return (
                    <div key={entry.id} className="break-words">
                      <span className="text-slate-600 mr-2">[{entry.time}]</span>
                      <span className={`font-bold mr-2 ${agentStyle.ansi}`}>[{entry.agent}]</span>
                      <span className="text-slate-300">{entry.message}</span>
                    </div>
                  );
                })}
                <div ref={terminalEndRef} />
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ====================================================================
          FLOATING PUSHOVER MOBILE TOAST NOTIFICATION
      ==================================================================== */}
      {toastAlert && (
        <div className="fixed bottom-5 right-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)] bg-slate-950/95 backdrop-blur-xl border border-rose-500/50 rounded-2xl p-4 shadow-2xl shadow-rose-500/20 animate-bounce-once">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  Pushover · Deal Alert
                </div>
                <div className="text-[10px] text-slate-400">just now · MessengerAgent</div>
              </div>
            </div>
            <button
              onClick={() => setToastAlert(null)}
              className="text-slate-500 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2.5 text-xs font-semibold text-white line-clamp-2">
            {toastAlert.title}
          </div>
          <div className="mt-2 flex items-center justify-between bg-slate-900/90 rounded-lg px-2.5 py-1.5 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">
              Deal: <strong className="text-white">${toastAlert.dealPrice.toFixed(2)}</strong>
            </span>
            <span className="text-emerald-400 font-bold">
              Save ${toastAlert.discount.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* ====================================================================
          AGENT BREAKDOWN & RAG NEIGHBORS INSPECTOR MODAL
      ==================================================================== */}
      {inspectModalDeal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspectModalDeal(null)}
        >
          <div
            className="bg-[#111827] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scroll p-5 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    {inspectModalDeal.category}
                  </span>
                  <span className="text-[11px] text-slate-400">{inspectModalDeal.source}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {inspectModalDeal.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectModalDeal(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {inspectModalDeal.description}
            </p>

            {/* Price Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] text-slate-400 uppercase">Listed Deal</div>
                <div className="text-base font-mono font-bold text-white mt-0.5">
                  ${inspectModalDeal.dealPrice.toFixed(2)}
                </div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                <div className="text-[10px] text-purple-300 uppercase">Specialist (40%)</div>
                <div className="text-base font-mono font-bold text-purple-200 mt-0.5">
                  ${inspectModalDeal.specialistEst.toFixed(2)}
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <div className="text-[10px] text-emerald-300 uppercase">Frontier RAG (45%)</div>
                <div className="text-base font-mono font-bold text-emerald-200 mt-0.5">
                  ${inspectModalDeal.frontierEst.toFixed(2)}
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <div className="text-[10px] text-amber-300 uppercase">RandomForest (15%)</div>
                <div className="text-base font-mono font-bold text-amber-200 mt-0.5">
                  ${inspectModalDeal.rfEst.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Ensemble Summary Banner */}
            <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-blue-300">
                  EnsembleAgent Weighted Valuation
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  0.45 × Frontier + 0.40 × QLoRA Specialist + 0.15 × RandomForest
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold text-white">
                  ${inspectModalDeal.ensembleEst.toFixed(2)}
                </div>
                <div className="text-xs font-mono font-semibold text-emerald-400">
                  Discount: ${inspectModalDeal.discount.toFixed(2)} ({inspectModalDeal.discountPct}%)
                </div>
              </div>
            </div>

            {inspectModalDeal.reasoning && (
              <div className="mt-3 text-xs text-slate-300 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                <span className="font-semibold text-emerald-400">FrontierAgent Reasoning: </span>
                {inspectModalDeal.reasoning}
              </div>
            )}

            {/* Retrieved ChromaDB Top-5 Neighbors */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Top-5 Retrieved ChromaDB RAG Neighbors
                </h4>
              </div>
              <div className="space-y-1.5">
                {inspectModalDeal.neighbors?.map((nb, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                        cos {nb.similarity.toFixed(3)}
                      </span>
                      <span className="text-slate-200 truncate">{nb.title}</span>
                    </div>
                    <span className="font-mono font-semibold text-emerald-400 shrink-0">
                      ${nb.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Evaluated at {formatTime(inspectModalDeal.timestamp)}
              </span>
              <a
                href={inspectModalDeal.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
              >
                Open Deal URL <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SLIDE-OVER DRAWER: PUSHOVER ALERTS & memory.json INSPECTOR
      ==================================================================== */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0f172a] border-l border-slate-800 h-full flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawerTab('alerts')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    drawerTab === 'alerts'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Pushover Alerts ({notifications.length})
                </button>
                <button
                  onClick={() => setDrawerTab('memory')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    drawerTab === 'memory'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5" />
                  memory.json
                </button>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll p-4">
              {drawerTab === 'alerts' ? (
                notifications.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-12">
                    No Pushover alerts dispatched yet. Run a cycle to detect bargains ≥ ${threshold}.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-md"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                          <span className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                            <Bell className="w-3 h-3" /> Pushover Mobile
                          </span>
                          <span className="font-mono">{formatTime(n.timestamp)}</span>
                        </div>
                        <div className="text-xs font-semibold text-white leading-snug">
                          {n.title}
                        </div>
                        <div className="mt-2.5 grid grid-cols-3 gap-2 text-center bg-slate-950/80 rounded-xl p-2 border border-slate-800/80 font-mono">
                          <div>
                            <div className="text-[9px] text-slate-500">DEAL</div>
                            <div className="text-xs font-bold text-white">
                              ${n.dealPrice.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-500">ESTIMATE</div>
                            <div className="text-xs font-bold text-blue-300">
                              ${n.ensembleEst.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-500">DISCOUNT</div>
                            <div className="text-xs font-bold text-emerald-400">
                              +${n.discount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">
                      ./memory.json ({deals.length} persisted deals)
                    </span>
                    <button
                      onClick={handleCopyMemory}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy JSON
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-[#070b14] border border-slate-800 rounded-xl p-3.5 text-[11px] font-mono text-indigo-200 overflow-x-auto custom-scroll leading-relaxed">
                    {memoryJsonString}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}