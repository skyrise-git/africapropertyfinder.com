import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 1. ENVIRONMENT VARIABLES & VALIDATION
// ==========================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_REFERRER = process.env.OPENROUTER_REFERRER || 'http://localhost:3000';
const OPENROUTER_TITLE = process.env.OPENROUTER_TITLE || 'Property Chatbot';

const isDev = process.env.NODE_ENV === 'development';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables.');
}
if (!OPENROUTER_API_KEY) {
  throw new Error('Missing OPENROUTER_API_KEY.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. TYPES (matching frontend expectations)
// ==========================================
interface Intent {
  type: 'search_properties' | 'crime_stats' | 'conversational' | 'clarification';
  filters?: {
    city?: string;
    state?: string;
    listingType?: 'sale' | 'rent';
    minPrice?: number;
    maxPrice?: number;
    numBedrooms?: number;
    pool?: boolean;
    wifi?: boolean;
    gym?: boolean;
  };
  locationQuery?: string;
  conversationalResponse?: string;
  clarificationQuestion?: string;
}

interface Property {
  id: string;
  title: string;
  listingType: 'sale' | 'rent' | 'student-housing';
  propertyType: string;
  city: string;
  state: string;
  numBedrooms: number;
  numBathrooms: number;
  furnishing: string;
  area?: number;
  rent?: number;
  price?: number;
  images?: { url: string }[];
  petsAllowed?: boolean;
  pool?: boolean;
  gym?: boolean;
  wifi?: boolean;
  security?: boolean;
  garden?: boolean;
  balcony?: boolean;
  parkingAvailable?: boolean;
  contactName?: string;
}

interface CrimeStation {
  id: string;
  station: string;
  district: string;
  province: string;
  safety_rating: number;
  safety_label: string;
  crime_index: number;
  total_serious_crimes_q1_2025: number;
  trend: 'Improving' | 'Stable' | 'Worsening';
  crime_breakdown: Record<string, number>;
}

// ==========================================
// 3. MAIN POST HANDLER (UPDATED)
// ==========================================
export async function POST(request: Request) {
  const requestCache = new Map<string, any>();

  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message payload is required.' }, { status: 400 });
    }

    if (requestCache.has(message)) {
      return NextResponse.json(requestCache.get(message));
    }

    let intent: Intent;
    let aiFailed = false; // track if all OpenRouter models failed

    try {
      intent = await callOpenRouter(message, history || []);
    } catch (llmError) {
      console.warn('OpenRouter LLM failed, using keyword fallback:', llmError);
      aiFailed = true; // all models failed
      intent = keywordIntentParser(message);
    }

    const responsePayload: { message?: string; properties?: Property[]; crimeData?: CrimeStation[] } = {};

    // Handle clarification intent
    if (intent.type === 'clarification') {
      responsePayload.message = intent.clarificationQuestion || "Could you please specify whether you want to rent or buy?";
      requestCache.set(message, responsePayload);
      if (aiFailed) prependHighTrafficWarning(responsePayload);
      return NextResponse.json(responsePayload);
    }

    if (intent.type === 'search_properties' && intent.filters) {
      // First attempt with original filters
      let { data, error } = await buildPropertyQuery(intent.filters);
      if (error) throw new Error(`Supabase error: ${error.message}`);
      
      let filtersUsed = { ...intent.filters };
      let relaxed = false;
      
      if (!data || data.length === 0) {
        console.log('No results with original filters, relaxing...');
        relaxed = true;
        
        // Strategy 1: Remove maxPrice filter if it exists
        if (filtersUsed.maxPrice) {
          delete filtersUsed.maxPrice;
          const { data: newData, error: newError } = await buildPropertyQuery(filtersUsed);
          if (!newError && newData && newData.length > 0) {
            data = newData;
            console.log('Relaxed by removing maxPrice');
          }
        }
        
        // Strategy 2: If still no results, also remove numBedrooms filter
        if (!data || data.length === 0) {
          if (filtersUsed.numBedrooms) {
            delete filtersUsed.numBedrooms;
            const { data: newData, error: newError } = await buildPropertyQuery(filtersUsed);
            if (!newError && newData && newData.length > 0) {
              data = newData;
              console.log('Relaxed by removing numBedrooms');
            }
          }
        }
        
        // Strategy 3: If still no results, remove city filter (but keep state if exists)
        if (!data || data.length === 0) {
          if (filtersUsed.city) {
            delete filtersUsed.city;
            const { data: newData, error: newError } = await buildPropertyQuery(filtersUsed);
            if (!newError && newData && newData.length > 0) {
              data = newData;
              console.log('Relaxed by removing city');
            }
          }
        }
      }
      
      responsePayload.properties = (data || []).map(formatProperty);
      
      if (relaxed && responsePayload.properties.length > 0) {
        responsePayload.message = `Found ${responsePayload.properties.length} similar property listing${responsePayload.properties.length !== 1 ? 's' : ''} (relaxed some filters). Try adjusting your criteria for more precise matches.`;
      } else if (responsePayload.properties.length === 0) {
        responsePayload.message = `No properties match your exact criteria. Try increasing your budget or broadening your search area.`;
      } else {
        responsePayload.message = `Found ${responsePayload.properties.length} property listing${responsePayload.properties.length !== 1 ? 's' : ''}.`;
      }
    }
    else if (intent.type === 'crime_stats' && intent.locationQuery) {
      const { data, error } = await buildCrimeQuery(intent.locationQuery);
      if (error) throw new Error(`Supabase crime error: ${error.message}`);
      responsePayload.crimeData = data || [];
      responsePayload.message = responsePayload.crimeData.length
        ? `Safety insights for ${intent.locationQuery}.`
        : `No crime data found for "${intent.locationQuery}".`;
    }
    else {
      responsePayload.message = intent.conversationalResponse || "How can I help you find a property or check area safety?";
    }

    // Add high‑traffic warning if the AI call failed
    if (aiFailed) {
      prependHighTrafficWarning(responsePayload);
    }

    requestCache.set(message, responsePayload);
    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { message: isDev ? error.message : 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper to add warning message at the beginning
function prependHighTrafficWarning(payload: { message?: string; properties?: any; crimeData?: any }) {
  const warning = "⚠️ Our AI service is experiencing high traffic. Please try again later. ";
  if (payload.message) {
    payload.message = warning + payload.message;
  } else {
    payload.message = warning + "I can still help with basic keyword searches. Try asking for properties or crime stats.";
  }
}

// ==========================================
// 4. OPENROUTER INTENT PARSER (UNCHANGED)
// ==========================================
const MODEL_FALLBACK_CHAIN = [
  // Universal router – auto‑selects best free model
  { model: 'openrouter/free', name: 'OpenRouter Free Router' },

  // NVIDIA Nemotron 3 family (high‑performance MoE)
  { model: 'nvidia/nemotron-3-ultra', name: 'NVIDIA Nemotron 3 Ultra' },
  { model: 'nvidia/nemotron-3-super', name: 'NVIDIA Nemotron 3 Super' },
  { model: 'nvidia/nemotron-3-nano-30b-a3b', name: 'NVIDIA Nemotron 3 Nano 30B A3B' },
  { model: 'nvidia/nemotron-3-nano-omni', name: 'NVIDIA Nemotron 3 Nano Omni' },

  // OpenAI OSS models (fast, agentic)
  { model: 'openai/gpt-oss-120b', name: 'OpenAI GPT‑OSS 120B' },
  { model: 'openai/gpt-oss-20b', name: 'OpenAI GPT‑OSS 20B' },

  // Poolside coding agents
  { model: 'poolside/laguna-m.1', name: 'Poolside Laguna M.1' },
  { model: 'poolside/laguna-xs.2', name: 'Poolside Laguna XS.2' },

  // Google Gemma 4 series (multimodal, large context)
  { model: 'google/gemma-4-31b-it', name: 'Google Gemma 4 31B' },
  { model: 'google/gemma-4-26b-a4b-it', name: 'Google Gemma 4 26B A4B' },

  // Nex AGI (agentic MoE)
  { model: 'nex-agi/nex-n2-pro', name: 'Nex AGI Nex‑N2‑Pro' },

  // Smaller NVIDIA models (vision, embedding)
  { model: 'nvidia/nemotron-nano-12b-2-vl', name: 'NVIDIA Nemotron Nano 12B 2 VL' },
  { model: 'nvidia/nemotron-nano-9b-v2', name: 'NVIDIA Nemotron Nano 9B V2' },
];
async function callOpenRouter(message: string, history: any[]): Promise<Intent> {
  const systemPrompt = `You are a real estate assistant for South Africa. Output only valid JSON. Decide one of four intent types:

1. "search_properties" – when the user clearly asks for properties to rent or buy.  
   Required: listingType ("rent", "sale", "student‑housing") AND at least one location or price filter.  
   Optional filters: city, state, minPrice, maxPrice, numBedrooms, pool, wifi, gym.

2. "crime_stats" – when the user asks about safety, crime, police stations.  
   Required: locationQuery (area, district, province, or station name).

3. "clarification" – when the user mentions a price (or other property criteria) but does NOT say whether they want to rent or buy.  
   Also use if city/state is missing or too vague.  
   Return: {"type":"clarification","clarificationQuestion":"Would you like to rent or buy?"}

4. "conversational" – for greetings, thank you, or off‑topic messages.

**Examples**:

User: "2-bedroom flat to rent in Cape Town under R15k"  
→ {"type":"search_properties","filters":{"city":"Cape Town","listingType":"rent","maxPrice":15000,"numBedrooms":2}}

User: "find a property under 40000" (no rent/buy)  
→ {"type":"clarification","clarificationQuestion":"Are you looking to rent or buy? Please specify rental or sale price."}

User: "student housing under R5000"  
→ {"type":"clarification","clarificationQuestion":"Do you need student housing to rent (per month) or to buy?"}

User: "houses for sale under 2 million in Johannesburg"  
→ {"type":"search_properties","filters":{"city":"Johannesburg","listingType":"sale","maxPrice":2000000}}

User: "crime near Sandton police station"  
→ {"type":"crime_stats","locationQuery":"Sandton"}

User: "hello"  
→ {"type":"conversational","conversationalResponse":"Hello! I can help you find properties or check safety. Tell me what you need."}

**Rules**:
- If the user mentions a price without "rent"/"buy"/"sale", ALWAYS return clarification.
- Prices can be in ZAR, with or without 'R', with 'k' (e.g., 40k = 40000) or 'million'.
- City/state names can be partial; use case‑insensitive matching later.
- For "student‑housing", treat it as a special listingType – require clarification if rent/buy not stated.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-4).map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  let lastError = null;
  for (const fallback of MODEL_FALLBACK_CHAIN) {
    try {
      console.log(`Attempting with model: ${fallback.name} (${fallback.model})`);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_REFERRER || 'http://localhost:3000',
          'X-Title': process.env.OPENROUTER_TITLE || 'Property Chatbot',
        },
        body: JSON.stringify({
          model: fallback.model,
          messages,
          temperature: 0.2,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      console.log(`Raw response from ${fallback.model}:`, content.slice(0, 200));

      // Try to extract JSON – sometimes models wrap it in markdown or add extra text
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        const braceStart = content.indexOf('{');
        const braceEnd = content.lastIndexOf('}');
        if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
          const potentialJson = content.substring(braceStart, braceEnd + 1);
          jsonMatch = [potentialJson];
        }
      }
      
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      
      const intent = JSON.parse(jsonMatch[0]) as Intent;
      console.log(`Success with model: ${fallback.model}`);
      return intent;
    } catch (error: any) {
      console.warn(`Model ${fallback.model} failed:`, error.message);
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw new Error(`All OpenRouter models failed. Last error: ${lastError?.message}`);
}

// ==========================================
// 5. KEYWORD FALLBACK PARSER (IMPROVED FOR AMBIGUITY)
// ==========================================
function keywordIntentParser(message: string): Intent {
  const lower = message.toLowerCase();

  // Crime intent
  if (lower.includes('crime') || lower.includes('safety') || lower.includes('police') || lower.includes('station')) {
    let location = lower.replace(/(crime|safety|stats|at|near|in|around|police|station)/g, '').trim();
    if (!location) location = 'South Africa';
    return { type: 'crime_stats', locationQuery: location };
  }

  // Property intent
  if (lower.includes('rent') || lower.includes('sale') || lower.includes('house') || lower.includes('apartment') || lower.includes('flat')) {
    const filters: any = {};
    if (lower.includes('rent')) filters.listingType = 'rent';
    if (lower.includes('sale') || lower.includes('buy')) filters.listingType = 'sale';
    
    const cities = [
      'cape town', 'johannesburg', 'durban', 'pretoria', 'port elizabeth',
      'stellenbosch', 'sandton', 'midrand', 'kempton park', 'krugersdorp',
      'pietermaritzburg', 'richards bay', 'east london', 'mthatha', 'kimberley'
    ];
    for (const city of cities) {
      if (lower.includes(city)) {
        filters.city = city.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }
    const bedroomMatch = message.match(/(\d+)\s*bed/);
    if (bedroomMatch) filters.numBedrooms = parseInt(bedroomMatch[1]);
    const priceMatch = message.match(/under\s+R?(\d+(?:\.\d+)?)\s*k/i);
    if (priceMatch) filters.maxPrice = parseFloat(priceMatch[1]) * 1000;
    
    // If listingType is still missing, ask for clarification
    if (!filters.listingType) {
      return {
        type: 'clarification',
        clarificationQuestion: "Do you want to rent or buy? Please specify so I can find the right properties for you."
      };
    }
    return { type: 'search_properties', filters };
  }

  // Check for price-only queries (e.g., "under 40000")
  const priceOnlyMatch = message.match(/under\s+R?(\d+(?:\.\d+)?)(\s*k|\s*million)?/i);
  if (priceOnlyMatch && !lower.includes('rent') && !lower.includes('sale') && !lower.includes('buy')) {
    return {
      type: 'clarification',
      clarificationQuestion: "I see you mentioned a price. Are you looking to rent or buy? Let me know and I'll help you find properties."
    };
  }

  return { type: 'conversational', conversationalResponse: "I can help you find properties or check crime stats. Try asking something like '2-bedroom flat for rent in Cape Town under R15k'." };
}

// ==========================================
// 6. SUPABASE QUERIES (FLEXIBLE VERSION)
// ==========================================
function buildPropertyQuery(filters: any) {
  let query = supabase
    .from('properties')
    .select('id, title, listingType, propertyType, city, state, numBedrooms, numBathrooms, furnishing, area, price, rent, images, petsAllowed, pool, gym, wifi, security, garden, balcony, parkingAvailable, contactName')
    .limit(5);

  // Listing type mapping
  if (filters.listingType) {
    let listingTypeFilter = filters.listingType;
    if (listingTypeFilter === 'student') listingTypeFilter = 'student-housing';
    query = query.eq('listingType', listingTypeFilter);
  }

  // Partial, case-insensitive matching for city and state
  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }
  if (filters.state) {
    query = query.ilike('state', `%${filters.state}%`);
  }

  // Exact match for bedrooms
  if (filters.numBedrooms !== undefined && filters.numBedrooms !== null) {
    query = query.eq('numBedrooms', filters.numBedrooms);
  }

  // Price/rent filters
  const priceCol = filters.listingType === 'rent' ? 'rent' : 'price';
  if (filters.minPrice !== undefined && filters.minPrice !== null) {
    query = query.gte(priceCol, filters.minPrice);
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
    query = query.lte(priceCol, filters.maxPrice);
  }

  // Amenities
  if (filters.pool !== undefined) query = query.eq('pool', filters.pool);
  if (filters.wifi !== undefined) query = query.eq('wifi', filters.wifi);
  if (filters.gym !== undefined) query = query.eq('gym', filters.gym);

  // 🔽 SORT: cheapest / lowest rent first
  query = query.order(priceCol, { ascending: true, nullsFirst: false });

  console.log('🔍 Query filters:', JSON.stringify(filters));
  return query;
}

function buildCrimeQuery(locationQuery: string) {
  return supabase
    .from('crime_stations')
    .select('id, station, district, province, safety_rating, safety_label, crime_index, total_serious_crimes_q1_2025, trend, crime_breakdown')
    .or(`station.ilike.%${locationQuery}%,district.ilike.%${locationQuery}%,province.ilike.%${locationQuery}%`)
    .order('safety_rating', { ascending: false })  
    .limit(3);
}
// ==========================================
// 7. FORMATTERS
// ==========================================
function formatProperty(dbProperty: any): Property {
  let images: { url: string }[] | undefined;
  if (dbProperty.images) {
    if (Array.isArray(dbProperty.images) && dbProperty.images.length > 0) {
      const first = dbProperty.images[0];
      const url = typeof first === 'object' && first.url ? first.url : String(first);
      images = [{ url }];
    } else if (typeof dbProperty.images === 'string') {
      try {
        const parsed = JSON.parse(dbProperty.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const url = parsed[0]?.url || parsed[0];
          images = [{ url }];
        }
      } catch {
        images = [{ url: dbProperty.images }];
      }
    }
  }
  if (!images) {
    images = [{ url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=240&fit=crop' }];
  }

  return {
    id: dbProperty.id,
    title: dbProperty.title,
    listingType: dbProperty.listingType,
    propertyType: dbProperty.propertyType,
    city: dbProperty.city,
    state: dbProperty.state,
    numBedrooms: dbProperty.numBedrooms,
    numBathrooms: dbProperty.numBathrooms,
    furnishing: dbProperty.furnishing,
    area: dbProperty.area,
    price: dbProperty.price,
    rent: dbProperty.rent,
    images,
    petsAllowed: dbProperty.petsAllowed,
    pool: dbProperty.pool,
    gym: dbProperty.gym,
    wifi: dbProperty.wifi,
    security: dbProperty.security,
    garden: dbProperty.garden,
    balcony: dbProperty.balcony,
    parkingAvailable: dbProperty.parkingAvailable,
    contactName: dbProperty.contactName,
  };
}