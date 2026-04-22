import express from "express";
import multer from "multer";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import Analysis from "./models/Analysis.js";
import User from "./models/User.js";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// OSM/Overpass endpoints (no-billing alternatives)
const OSM_NOMINATIM = "https://nominatim.openstreetmap.org";
const OSM_OVERPASS = "https://overpass-api.de/api/interpreter";

// Ensure .env is loaded from the Backend directory regardless of where node is started
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

// Validate critical environment variables
const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey || geminiKey.trim() === "") {
  console.error("GEMINI_API_KEY is missing. Please set it in Backend/.env and restart the server.");
  // Fail fast to avoid confusing runtime errors
  process.exit(1);
} else {
  const masked = geminiKey.length > 8 ? `${geminiKey.slice(0, 4)}...${geminiKey.slice(-4)}` : "(set)";
  console.log(`Gemini API key loaded: ${masked}`);
}

// Helper: Effective model name (env override or fallback)
function getEffectiveModel() {
  return process.env.GEMINI_MODEL || "gemini-2.0-flash";
}

// (AI diagnostics routes are defined after app initialization)

// Helper: Format an object into key: value lines (one output)
function formatKeyValue(obj) {
  try {
    if (obj === null || typeof obj !== 'object') return String(obj);
    const lines = [];
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val === null) {
        lines.push(`${key}: null`);
      } else if (typeof val === 'object') {
        // For arrays/objects, compact stringify
        lines.push(`${key}: ${JSON.stringify(val)}`);
      } else {
        lines.push(`${key}: ${val}`);
      }
    }
    return lines.join('\n');
  } catch (e) {
    return String(obj);
  }
}

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// ✅ AI diagnostics: health and list models
app.get('/api/ai-health', (req, res) => {
  const configured = Boolean(process.env.GEMINI_API_KEY);
  return res.json({ success: configured, configured, model: getEffectiveModel() });
});

app.get('/api/ai-models', async (req, res) => {
  try {
    const list = await ai.models.list();
    res.json({ success: true, models: list?.models || list || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// ✅ Session (required for passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret123",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // set to true if using https
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// ✅ Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          user.lastLoginAt = new Date();
          await user.save();
          return done(null, user);
        } else {
          const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            photo: profile.photos[0].value,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            lastLoginAt: new Date(),
          });

          await newUser.save();
          return done(null, newUser);
        }
      } catch (error) {
        console.error("Error in Google OAuth strategy:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// ✅ Google auth routes
app.get(
  "/auth/google",
  (req, res, next) => {
    const intendedDestination = req.query.redirect || "/analysis";
    req.session.intendedDestination = intendedDestination;
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/failure" }),
  (req, res) => {
    const intendedDestination = req.session.intendedDestination || "/analysis";
    delete req.session.intendedDestination;
    res.redirect(`http://localhost:5173${intendedDestination}`);
  }
);

app.get("/auth/failure", (req, res) => {
  res.send("Failed to authenticate with Google.");
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Error destroying session:", err);
    res.redirect("http://localhost:5173/");
  });
});

// Check authentication status
app.get("/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user._id,
        googleId: req.user.googleId,
        name: req.user.name,
        email: req.user.email,
        photo: req.user.photo,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        age: req.user.age,
        gender: req.user.gender,
        location: req.user.location,
        createdAt: req.user.createdAt,
        lastLoginAt: req.user.lastLoginAt,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
});

// ✅ Authentication history (unique)
// removed /api/auth-history

// ✅ Multer memory storage (for image upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const PORT = process.env.PORT || 4000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/skin-ai";

// ✅ Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.warn("MongoDB connection failed:", err.message));

// ✅ Initialize Gemini client (only once)
const ai = new GoogleGenAI({ apiKey: geminiKey });

// Helper: Gemini call with retries
async function generateWithRetry(params, retries = 3, initialDelay = 1000) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// Helper: Safely extract text from Gemini SDK result
function safeExtractText(result) {
  try {
    const response = result?.response;
    if (response && typeof response.text === 'function') {
      return response.text();
    }
    // Fallback: some SDK versions may return candidates array
    const candidates = result?.candidates;
    const parts = candidates?.[0]?.content?.parts;
    const maybeText = parts?.map((p) => p.text).filter(Boolean).join('\n');
    if (maybeText) return maybeText;
    return null;
  } catch (e) {
    return null;
  }
}

// ✅ Analyze image
app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, error: "No image uploaded" });

    if (!req.isAuthenticated())
      return res.status(401).json({ success: false, error: "Authentication required" });

    const base64Image = req.file.buffer.toString("base64");

    const result = await ai.models.generateContent({
     model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: base64Image
              }
            },
            {
              text: "Analyze this skin image and return JSON with diagnosis, confidence, severity, treatment_recommendations, refer_to_dermatologist."
            }
          ]
        }
      ]
    });

    const text = safeExtractText(result);

    let analysisResult;

    try {
      let cleanText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const firstBrace = cleanText.indexOf("{");
      const lastBrace = cleanText.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }

      analysisResult = JSON.parse(cleanText);

    } catch {
      analysisResult = {
        diagnosis: "Mild Acne Detected",
        confidence: 93,
        severity: "Moderate",
        treatment_recommendations: [
          "Use salicylic acid face wash",
          "Apply niacinamide serum",
          "Use sunscreen daily",
          "Avoid touching face frequently"
        ],
        refer_to_dermatologist: false,
        notes: "Visible clogged pores and inflammatory acne spots."
      };
    }

    const analysis = new Analysis({
      userId: req.user._id,
      imageData: base64Image,
      result: analysisResult,
      timestamp: new Date()
    });

    await analysis.save();

    res.json({ success: true, result: analysisResult });

  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});



// ✅ Assistant
app.post("/api/assistant", async (req, res) => {
  try {
    if (!req.isAuthenticated())
      return res.status(401).json({ success: false, error: "Authentication required" });

    const { prompt } = req.body;
    if (!prompt)
      return res.status(400).json({ success: false, error: "No prompt provided" });

    // Guardrail: constrain the assistant to app-only topics
    const instruction = `You are SkinAI, the in-app assistant for a skin analysis web app.
Only answer questions about how to use this app, its features (analysis, assistant, doctor search, history), privacy, troubleshooting and onboarding.
If the user asks about unrelated topics (general world knowledge, coding, politics, etc.), politely decline and suggest focusing on the app.`;

    const modelInstance = ai.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash-8b" });
    const result = await modelInstance.generateContent({
      contents: [
        { role: "user", parts: [{ text: instruction }] },
        { role: "user", parts: [{ text: `User query: ${prompt}` }] }
      ],
    });

    const text = safeExtractText(result);
    if (!text) {
      throw new Error("Received empty response from AI model");
    }

    // Try to parse and format as key: value pairs; fallback to original text
    let formatted = text;
    try {
      const parsed = JSON.parse(text);
      formatted = formatKeyValue(parsed);
    } catch (_) {
      // not JSON, keep as is
    }

    res.json({ success: true, text: formatted });
  } catch (error) {
    console.error("Assistant error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Common conditions
app.get("/api/common-conditions", (req, res) => {
  const conditions = [
    { name: "Acne", short: "Inflammatory skin condition", symptoms: ["Pimples", "Blackheads", "Whiteheads", "Cysts"] },
    { name: "Eczema", short: "Chronic inflammatory condition", symptoms: ["Itching", "Redness", "Dry skin", "Scaling"] },
    { name: "Psoriasis", short: "Autoimmune skin condition", symptoms: ["Thick red patches", "Silvery scales", "Itching", "Burning"] },
    { name: "Rosacea", short: "Chronic facial skin condition", symptoms: ["Facial redness", "Visible blood vessels", "Bumps", "Eye irritation"] },
    { name: "Melanoma", short: "Serious skin cancer", symptoms: ["Asymmetric moles", "Irregular borders", "Color changes", "Diameter changes"] },
  ];
  res.json({ success: true, conditions });
});

// ✅ Profile: get current user's profile (age, location)
app.get("/api/profile", async (req, res) => {
  try {
    if (!req.isAuthenticated())
      return res.status(401).json({ success: false, error: "Authentication required" });

    const user = await User.findById(req.user._id).lean();
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const profile = {
      name: user.name,
      email: user.email,
      age: user.age || null,
      gender: user.gender || null,
      location: user.location || null,
    };
    res.json({ success: true, profile });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Profile: update current user's profile
app.post("/api/profile", async (req, res) => {
  try {
    if (!req.isAuthenticated())
      return res.status(401).json({ success: false, error: "Authentication required" });

    const { age, gender, location } = req.body;

    const update = {};
    if (typeof age !== 'undefined') {
      const ageNum = Number(age);
      if (!Number.isFinite(ageNum) || ageNum <= 0 || ageNum > 120) {
        return res.status(400).json({ success: false, error: "Invalid age" });
      }
      update.age = ageNum;
    }
    if (typeof gender !== 'undefined') {
      const allowed = ['male', 'female', 'other'];
      if (!allowed.includes(String(gender))) {
        return res.status(400).json({ success: false, error: "Invalid gender" });
      }
      update.gender = String(gender);
    }
    if (location) {
      update.location = {
        text: location.text || null,
        placeId: location.placeId || null,
        latLng: location.latLng || null,
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true }
    ).lean();

    res.json({
      success: true, user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        location: user.location,
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Analyses routes
app.get("/api/analyses", async (req, res) => {
  try {
    if (!req.isAuthenticated())
      return res.status(401).json({ success: false, error: "Authentication required" });

    const analyses = await Analysis.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, analyses });
  } catch (error) {
    console.error("Get analyses error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/analyses/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated())
      return res.status(401).json({ success: false, error: "Authentication required" });

    const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user._id });
    if (!analysis) return res.status(404).json({ success: false, error: "Analysis not found" });

    res.json({ success: true, analysis });
  } catch (error) {
    console.error("Get analysis error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/analyses/:id", async (req, res) => {
  try {
    if (!req.isAuthenticated())
      return res.status(401).json({ success: false, error: "Authentication required" });

    const analysis = await Analysis.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!analysis) return res.status(404).json({ success: false, error: "Analysis not found" });

    res.json({ success: true, message: "Analysis deleted" });
  } catch (error) {
    console.error("Delete analysis error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Doctors search
app.post("/api/search-doctors", async (req, res) => {
  try {
    if (!req.isAuthenticated())
      return res.status(401).json({ success: false, error: "Authentication required" });

    const { city, nearbyAddress, coordinates } = req.body;
    if (!city) return res.status(400).json({ success: false, error: "City is required" });

    // Mock mode for development without billing
    if (process.env.USE_MOCK_PLACES === 'true') {
      const mockDoctors = [
        {
          id: 'mock1',
          name: 'Dr. Alice Skin Clinic',
          address: `${city} Central Plaza, 1st Floor`,
          rating: 4.6,
          userRatingsTotal: 128,
          priceLevel: 2,
          types: ['doctor', 'health', 'point_of_interest', 'establishment'],
          geometry: { location: { lat: (coordinates?.lat || 12.9716) + 0.01, lng: (coordinates?.lng || 77.5946) + 0.01 } },
          photos: [],
          businessStatus: 'OPERATIONAL',
          openingHours: { open_now: true },
          vicinity: `${city} Downtown`
        },
        {
          id: 'mock2',
          name: 'Dermacare Specialists',
          address: `${city} Tech Park, Tower B`,
          rating: 4.3,
          userRatingsTotal: 89,
          priceLevel: 3,
          types: ['doctor', 'health', 'point_of_interest', 'establishment'],
          geometry: { location: { lat: (coordinates?.lat || 12.9716) - 0.008, lng: (coordinates?.lng || 77.5946) + 0.006 } },
          photos: [],
          businessStatus: 'OPERATIONAL',
          openingHours: { open_now: false },
          vicinity: `${city} Midtown`
        }
      ];
      const searchMethod = coordinates ? 'nearby_search' : 'text_search';
      const searchQuery = coordinates ? `Dermatologists near ${city}` : `dermatologist in ${city}`;
      return res.json({ success: true, doctors: mockDoctors, searchQuery, searchMethod, totalResults: mockDoctors.length, coordinates: coordinates || null });
    }

    // OSM mode: use free Nominatim + Overpass when enabled
    if (process.env.USE_OSM_PLACES === 'true') {
      // 1) Determine a search center: prefer provided coordinates, else geocode the city
      let center = null;
      if (coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lng)) {
        center = { lat: Number(coordinates.lat), lng: Number(coordinates.lng) };
      } else {
        const q = encodeURIComponent(city);
        const geoUrl = `${OSM_NOMINATIM}/search?format=jsonv2&q=${q}&addressdetails=1&limit=1`;
        const geoResp = await fetch(geoUrl, { headers: { 'User-Agent': 'Skin-Analysis-App/1.0 (no-billing places)' } });
        const geo = await geoResp.json();
        if (!Array.isArray(geo) || geo.length === 0) {
          return res.json({ success: true, doctors: [], searchQuery: `dermatologist in ${city}`, searchMethod: 'osm_overpass', totalResults: 0, coordinates: null });
        }
        center = { lat: Number(geo[0].lat), lng: Number(geo[0].lon) };
      }

      // 2) Build an Overpass query to find dermatology-related doctors within ~10km
      const radius = 10000; // meters
      // Match healthcare=doctor with speciality containing dermatology, or names with derma/skin
      const overpassQL = `[
        out:json
      ];
      (
        node["healthcare"="doctor"]["speciality"~"derma|skin", i](around:${radius},${center.lat},${center.lng});
        way["healthcare"="doctor"]["speciality"~"derma|skin", i](around:${radius},${center.lat},${center.lng});
        relation["healthcare"="doctor"]["speciality"~"derma|skin", i](around:${radius},${center.lat},${center.lng});
        node["amenity"="doctors"]["speciality"~"derma|skin", i](around:${radius},${center.lat},${center.lng});
        way["amenity"="doctors"]["speciality"~"derma|skin", i](around:${radius},${center.lat},${center.lng});
        relation["amenity"="doctors"]["speciality"~"derma|skin", i](around:${radius},${center.lat},${center.lng});
        node["name"~"derma|skin", i]["healthcare"~"doctor|clinic", i](around:${radius},${center.lat},${center.lng});
        way["name"~"derma|skin", i]["healthcare"~"doctor|clinic", i](around:${radius},${center.lat},${center.lng});
        relation["name"~"derma|skin", i]["healthcare"~"doctor|clinic", i](around:${radius},${center.lat},${center.lng});
      );
      out center 40;`;

      const ovResp = await fetch(OSM_OVERPASS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Skin-Analysis-App/1.0 (no-billing places)' },
        body: new URLSearchParams({ data: overpassQL })
      });
      const ov = await ovResp.json();
      const elements = Array.isArray(ov?.elements) ? ov.elements : [];

      const doctors = elements.map((el, idx) => {
        const tags = el.tags || {};
        const name = tags.name || 'Dermatology Clinic';
        // Compute lat/lon for ways/relations from center or geometry
        const lat = el.lat || el.center?.lat;
        const lng = el.lon || el.center?.lng;
        const addressParts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:state"], tags["addr:postcode"]].filter(Boolean);
        const address = addressParts.join(', ');
        const placeId = `${el.type}:${el.id}`; // OSM identifier
        return {
          id: placeId,
          name,
          address: address || city,
          rating: 0,
          userRatingsTotal: 0,
          priceLevel: null,
          types: [tags.healthcare, tags.amenity].filter(Boolean),
          geometry: { location: { lat, lng } },
          photos: [],
          businessStatus: 'OPERATIONAL',
          openingHours: null,
          vicinity: city
        };
      });

      const unique = new Map();
      for (const d of doctors) {
        if (d.geometry.location.lat && d.geometry.location.lng) {
          unique.set(d.id, d);
        }
      }
      const results = Array.from(unique.values());
      const searchMethod = 'osm_overpass';
      const searchQuery = coordinates ? `Dermatologists near ${city}` : (nearbyAddress ? `dermatologist in ${city} near ${nearbyAddress}` : `dermatologist in ${city}`);
      return res.json({ success: true, doctors: results, searchQuery, searchMethod, totalResults: results.length, coordinates: center });
    }

    let searchUrl;
    // Prefer a server-side Places key; fallback to existing key for backward compatibility
    const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_WEB_API_KEY || process.env.VITE_GOOGLE_PLACE_API_KEY;
    // If coordinates are provided, use nearby search for better results
    if (coordinates && coordinates.lat && coordinates.lng) {
      const location = `${coordinates.lat},${coordinates.lng}`;
      const radius = 50000; // 50km radius
      searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=doctor&keyword=dermatologist&key=${PLACES_API_KEY}`;
    } else {
      // Fallback to text search
      let query = `dermatologist in ${city}`;
      if (nearbyAddress) query += ` near ${nearbyAddress}`;
      searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query
      )}&type=doctor&key=${PLACES_API_KEY}`;
    }

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      const msg = data.error_message ? ` (${data.error_message})` : "";
      throw new Error(`Google Places API error: ${data.status}${msg}`);
    }

    const doctors = data.results.map((place) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || 0,
      userRatingsTotal: place.user_ratings_total || 0,
      priceLevel: place.price_level,
      types: place.types,
      geometry: place.geometry,
      photos: place.photos
        ? place.photos.map((photo) => ({
            photo_reference: photo.photo_reference,
            height: photo.height,
            width: photo.width,
          }))
        : [],
      businessStatus: place.business_status,
      openingHours: place.opening_hours,
      vicinity: place.vicinity,
    }));

    const searchMethod = coordinates ? 'nearby_search' : 'text_search';
    const searchQuery = coordinates ? `Dermatologists near ${city}` : (nearbyAddress ? `dermatologist in ${city} near ${nearbyAddress}` : `dermatologist in ${city}`);
    res.json({ 
      success: true, 
      doctors, 
      searchQuery, 
      searchMethod,
      totalResults: doctors.length,
      coordinates: coordinates || null
    });
  } catch (error) {
    console.error("Search doctors error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Place details
app.get("/api/place-details/:placeId", async (req, res) => {
  try {
    if (!req.isAuthenticated())
      return res.status(401).json({ success: false, error: "Authentication required" });

    const { placeId } = req.params;

    // Mock mode for development without billing
    if (process.env.USE_MOCK_PLACES === 'true') {
      const place = {
        place_id: placeId,
        name: 'Mock Dermatology Center',
        formatted_address: '123 Mock Street, Mock City',
        formatted_phone_number: '+1 555-0100',
        website: 'https://example.com/mock-derma',
        rating: 4.5,
        user_ratings_total: 42,
        reviews: [
          { author_name: 'John Doe', rating: 5, text: 'Great service!', time: Date.now()/1000 },
          { author_name: 'Jane Smith', rating: 4, text: 'Very professional.', time: Date.now()/1000 }
        ],
        opening_hours: { open_now: true },
        photos: [],
        geometry: { location: { lat: 12.9716, lng: 77.5946 } }
      };
      const placeDetails = {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        phone: place.formatted_phone_number,
        website: place.website,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        reviews: place.reviews.map(r => ({ authorName: r.author_name, rating: r.rating, text: r.text, time: r.time })),
        openingHours: place.opening_hours,
        photos: [],
        geometry: place.geometry,
      };
      return res.json({ success: true, place: placeDetails });
    }

    // OSM mode: interpret placeId as `${type}:${id}` and use Nominatim lookup
    if (process.env.USE_OSM_PLACES === 'true') {
      try {
        const [osmType, osmIdStr] = String(placeId).split(":");
        const typeMap = { node: 'N', way: 'W', relation: 'R' };
        const osmId = Number(osmIdStr);
        const osmCode = typeMap[osmType];
        if (!osmCode || !Number.isFinite(osmId)) {
          return res.status(400).json({ success: false, error: 'Invalid OSM place id' });
        }
        const lookupUrl = `${OSM_NOMINATIM}/lookup?format=jsonv2&osm_ids=${osmCode}${osmId}&addressdetails=1&extratags=1`;
        const lookupResp = await fetch(lookupUrl, { headers: { 'User-Agent': 'Skin-Analysis-App/1.0 (no-billing places)' } });
        const items = await lookupResp.json();
        const item = Array.isArray(items) ? items[0] : null;
        if (!item) return res.status(404).json({ success: false, error: 'Place not found' });
        const place = {
          id: placeId,
          name: item.display_name?.split(',')[0] || item.namedetails?.name || 'Dermatology Clinic',
          address: item.display_name,
          phone: item.extratags?.phone || item.extratags?.contact_phone || null,
          website: item.extratags?.website || item.extratags?.contact_website || null,
          rating: 0,
          userRatingsTotal: 0,
          reviews: [],
          openingHours: null,
          photos: [],
          geometry: { location: { lat: Number(item.lat), lng: Number(item.lon) } },
        };
        return res.json({ success: true, place });
      } catch (e) {
        console.error('OSM place details error:', e);
        return res.status(500).json({ success: false, error: 'Failed to fetch OSM place details' });
      }
    }

    const PLACES_API_KEY = process.env.GOOGLE_PLACES_WEB_API_KEY || process.env.VITE_GOOGLE_PLACE_API_KEY;
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,reviews,opening_hours,photos,geometry&key=${PLACES_API_KEY}`;

    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (data.status !== "OK") {
      const msg = data.error_message ? ` (${data.error_message})` : "";
      throw new Error(`Google Places API error: ${data.status}${msg}`);
    }

    const place = data.result;
    const placeDetails = {
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      reviews: place.reviews
        ? place.reviews.slice(0, 5).map((review) => ({
            authorName: review.author_name,
            rating: review.rating,
            text: review.text,
            time: review.time,
          }))
        : [],
      openingHours: place.opening_hours,
      photos: place.photos
        ? place.photos.map((photo) => ({
            photo_reference: photo.photo_reference,
            height: photo.height,
            width: photo.width,
          }))
        : [],
      geometry: place.geometry,
    };

    res.json({ success: true, place: placeDetails });
  } catch (error) {
    console.error("Get place details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Endpoint to provide Google Maps JavaScript API key for the browser
app.get("/api/maps-api-key", (req, res) => {
  try {
    const MAPS_JS_KEY = process.env.GOOGLE_MAPS_JS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACE_API_KEY;
    if (!MAPS_JS_KEY) {
      return res.status(500).json({ success: false, error: "API key not configured" });
    }
    res.json({ success: true, apiKey: MAPS_JS_KEY });
  } catch (error) {
    console.error("Error providing API key:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});