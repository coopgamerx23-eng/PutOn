// PutOn/server.js
import express from "express";
import session from "express-session";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import SQLiteStore from "connect-sqlite3";
import multer from 'multer';
import fs from 'fs/promises';


// Configure multer for profile picture uploads
const profilePicStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(ROOT, 'assets/images/profile-pictures');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const userId = req.session.userId;
    const ext = path.extname(file.originalname);
    cb(null, `user_${userId}_${Date.now()}${ext}`);
  }
});

const uploadProfilePic = multer({ 
  storage: profilePicStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
})

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(ROOT, 'assets/images/outfits/user-posts');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `post_${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});


const SQLiteStoreSession = SQLiteStore(session);

// Load environment variables FIRST
dotenv.config();

// Debug: Check if API key is loaded
console.log('🔑 API Key loaded:', process.env.HUGGINGFACE_API_KEY ? 'YES ✓' : 'NO ✗');
if (process.env.HUGGINGFACE_API_KEY) {
  console.log('🔑 API Key preview:', process.env.HUGGINGFACE_API_KEY.substring(0, 10) + '...');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;
const ASSETS = path.join(ROOT, "assets");
const PAGES = path.join(ROOT, "pages");
const COMPONENTS = path.join(ROOT, "components");
const DATA = path.join(ROOT, "data");
const DB_PATH = path.join(ROOT, "data/database.db");

console.log("Server starting...");
console.log("Project root:", ROOT);
console.log("Assets dir:", ASSETS);
console.log("Pages dir:", PAGES);
console.log("Components dir:", COMPONENTS);
console.log("DB path:", DB_PATH);


const app = express();
const PORT = process.env.PORT || 3000;


// --- Middleware ---
// app.use(cors());
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true , limit: '10mb'}));
app.use(express.json());
app.use(
  session({
    store: new SQLiteStoreSession({ db: "sessions.sqlite", dir: DATA }),
    secret: "meaders",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    },
  })
);


// --- Serve static directories ---
app.use("/assets", express.static(ASSETS));
app.use("/components", express.static(COMPONENTS));
app.use("/data", express.static(DATA));


// ============================================
// CLOTHING DETECTION DATA & FUNCTIONS
// ============================================
const CLOTHING_CATEGORIES = {
  'top': ['shirt', 't-shirt', 'blouse', 'sweater', 'hoodie', 'tank'],
  'bottom': ['pants', 'jeans', 'shorts', 'skirt', 'trousers'],
  'outerwear': ['jacket', 'coat', 'blazer', 'cardigan'],
  'dress': ['dress', 'gown'],
  'footwear': ['shoes', 'sneakers', 'boots', 'sandals'],
  'accessories': ['hat', 'bag', 'scarf', 'sunglasses', 'watch']
};


const BRANDS = ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Gap', 'Levi\'s'];
const COLORS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Gray', 'Beige'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];


// Function to generate realistic clothing data
function generateClothingData() {
  const items = [];
  const numItems = 2 + Math.floor(Math.random() * 3); // 2-4 items
 
  const itemTemplates = [
    { type: 'Top', names: ['Cotton Tee', 'Graphic T-Shirt', 'Crew Neck Sweater', 'Hoodie'] },
    { type: 'Bottom', names: ['Slim Fit Jeans', 'Cargo Pants', 'Athletic Shorts', 'Chinos'] },
    { type: 'Outerwear', names: ['Denim Jacket', 'Bomber Jacket', 'Windbreaker', 'Blazer'] },
    { type: 'Footwear', names: ['Classic Sneakers', 'Running Shoes', 'Canvas Shoes', 'Boots'] },
    { type: 'Accessories', names: ['Baseball Cap', 'Backpack', 'Sunglasses', 'Watch'] }
  ];
 
  const shuffled = itemTemplates.sort(() => 0.5 - Math.random());
 
  for (let i = 0; i < numItems && i < shuffled.length; i++) {
    const template = shuffled[i];
    const randomName = template.names[Math.floor(Math.random() * template.names.length)];
    const randomBrand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const randomSize = SIZES[Math.floor(Math.random() * SIZES.length)];
    const price = 25 + (Math.floor(Math.random() * 15) * 5);
   
    items.push({
      type: template.type,
      name: randomName,
      brand: randomBrand,
      color: randomColor,
      size: randomSize,
      price: `$${price}.99`,
      confidence: 85 + Math.floor(Math.random() * 15)
    });
  }
 
  return items;
}


// Helper function to parse clothing from AI caption
function parseClothingFromCaption(caption) {
  const items = [];
  const lowerCaption = caption.toLowerCase();
 
  // Define clothing keywords and their mappings
  const clothingKeywords = {
    'shirt': { type: 'Top', name: 'Shirt' },
    't-shirt': { type: 'Top', name: 'T-Shirt' },
    'tshirt': { type: 'Top', name: 'T-Shirt' },
    'blouse': { type: 'Top', name: 'Blouse' },
    'sweater': { type: 'Top', name: 'Sweater' },
    'hoodie': { type: 'Top', name: 'Hoodie' },
    'tank': { type: 'Top', name: 'Tank Top' },
    'pants': { type: 'Bottom', name: 'Pants' },
    'jeans': { type: 'Bottom', name: 'Jeans' },
    'shorts': { type: 'Bottom', name: 'Shorts' },
    'skirt': { type: 'Bottom', name: 'Skirt' },
    'trousers': { type: 'Bottom', name: 'Trousers' },
    'jacket': { type: 'Outerwear', name: 'Jacket' },
    'coat': { type: 'Outerwear', name: 'Coat' },
    'blazer': { type: 'Outerwear', name: 'Blazer' },
    'dress': { type: 'Dress', name: 'Dress' },
    'shoes': { type: 'Footwear', name: 'Shoes' },
    'sneakers': { type: 'Footwear', name: 'Sneakers' },
    'boots': { type: 'Footwear', name: 'Boots' },
    'sandals': { type: 'Footwear', name: 'Sandals' },
    'hat': { type: 'Accessories', name: 'Hat' },
    'cap': { type: 'Accessories', name: 'Cap' },
    'bag': { type: 'Accessories', name: 'Bag' },
    'sunglasses': { type: 'Accessories', name: 'Sunglasses' },
    'glasses': { type: 'Accessories', name: 'Glasses' }
  };
 
  // Color detection
  const colors = ['black', 'white', 'blue', 'red', 'green', 'gray', 'grey', 'beige', 'brown', 'pink', 'yellow', 'purple', 'navy', 'denim'];
  let detectedColor = 'Unknown';
  for (const color of colors) {
    if (lowerCaption.includes(color)) {
      detectedColor = color.charAt(0).toUpperCase() + color.slice(1);
      break;
    }
  }
 
  // Detect clothing items from caption
  const foundItems = new Set();
  for (const [keyword, itemInfo] of Object.entries(clothingKeywords)) {
    if (lowerCaption.includes(keyword) && !foundItems.has(itemInfo.type)) {
      foundItems.add(itemInfo.type);
     
      const randomBrand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
      const randomSize = SIZES[Math.floor(Math.random() * SIZES.length)];
      const price = 25 + (Math.floor(Math.random() * 15) * 5);
     
      items.push({
        type: itemInfo.type,
        name: itemInfo.name,
        brand: randomBrand,
        color: detectedColor,
        size: randomSize,
        price: `$${price}.99`,
        confidence: 75 + Math.floor(Math.random() * 20)
      });
    }
  }
 
  // If nothing detected, return empty array
  return items;
}


// ============================================
// DATABASE INITIALIZATION
// ============================================
let db;


(async function init() {
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });


    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        bio TEXT,
        location TEXT,
        birthday TEXT,
        shirt_size TEXT,
        waist_size TEXT,
        chest_size TEXT,
        shoe_size TEXT,
        inseam TEXT,
        height TEXT,
        dark_mode TEXT,
        push_notifications TEXT,
        email_updates TEXT,
        private_profile TEXT,
        show_size_recommendations TEXT,
        preferred_style TEXT,
        hide_saved_content TEXT,
        show_following TEXT,
        show_followers TEXT,
        language TEXT,
        profile_picture TEXT,
        password_hash TEXT
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        type TEXT,
        brand TEXT,
        color TEXT,
        size TEXT,
        price TEXT,
        image TEXT,
        category TEXT,
        notes TEXT,
        addedAt TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS putons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        type TEXT,
        brand TEXT,
        color TEXT,
        size TEXT,
        price TEXT,
        image TEXT,
        category TEXT,
        notes TEXT,
        source_image TEXT,
        added_at TEXT
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS wardrobe (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        category TEXT,
        image TEXT,
        brand TEXT,
        color TEXT,
        size TEXT,
        price TEXT,
        material TEXT,
        addedDate TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS outfits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS outfit_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        outfit_id INTEGER,
        item_id INTEGER,
        FOREIGN KEY (outfit_id) REFERENCES outfits(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES wardrobe(id)
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_url TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, post_url)
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS post_reposts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_url TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, post_url)
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS post_saves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_url TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, post_url)
      );
    `);

    console.log('✅ Database initialized');


  } catch (error) {
    process.exit(1);
  }
})();


// ============================================
// ROUTES
// ============================================


// ✅ Homepage route
app.get("/", (req, res) => {
  res.sendFile(path.join(PAGES, "homepage.html"));
});


// ✅ Generic page route (for /pages/other.html)
app.get("/pages/:name", (req, res) => {
  res.sendFile(path.join(PAGES, req.params.name));
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});


// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    sampleData: generateClothingData()
  });
});


// API endpoint for clothing detection with FREE AI
app.post('/api/detect-clothing', async (req, res) => {
  try {
    const { imageUrl } = req.body;
   
    console.log('📸 Analyzing image:', imageUrl);
   
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'No image URL provided'
      });
    }
   
    // Check if Hugging Face API key is set
    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
   
    console.log('🔍 Checking API key... Key exists:', !!HF_API_KEY);
   
    if (!HF_API_KEY) {
      console.log('⚠️ No Hugging Face API key found, using mock data');
      console.log('💡 Get a FREE API key at: https://huggingface.co/settings/tokens');
      // Fallback to mock data if no API key
      await new Promise(resolve => setTimeout(resolve, 1000));
      const detectedItems = generateClothingData();
      return res.json({
        success: true,
        items: detectedItems,
        total: detectedItems.length,
        message: 'Detection complete (mock data - set HUGGINGFACE_API_KEY for free AI detection)'
      });
    }
   
    // Use FREE Hugging Face AI vision detection
    console.log('🤖 Using Hugging Face Vision API (FREE) for real detection...');
   
    try {
      // First, fetch the image to convert to base64
      let imageData;
      if (imageUrl.startsWith('http://localhost') || imageUrl.startsWith('/')) {
        // Local image - read from file system
        const fs = await import('fs');
        const fsPromises = await import('fs/promises');
       
        // Convert URL to file path
        let imagePath = imageUrl.replace('http://localhost:3000', '').replace('http://localhost:' + PORT, '');
        if (imagePath.startsWith('/')) {
          imagePath = path.join(ROOT, imagePath);
        }
       
        console.log('📂 Reading local file:', imagePath);
       
        try {
          imageData = await fsPromises.readFile(imagePath);
        } catch (fileError) {
          console.error('File read error:', fileError.message);
          throw new Error(`Could not read image file: ${fileError.message}`);
        }
      } else {
        // Remote image - fetch it
        const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        imageData = Buffer.from(imgResponse.data);
      }
     
      // Resize image if it's too large (max 1MB for free tier)
      const sharp = (await import('sharp')).default;
      console.log('🖼️ Resizing image to reduce size...');
     
      imageData = await sharp(imageData)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toBuffer();
     
      console.log('📦 Image size:', (imageData.length / 1024).toFixed(2), 'KB');
     
      // Use ViT-GPT2 model for image captioning (more reliable)
      console.log('🔄 Sending image to Hugging Face API...');
     
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base',
        imageData,
        {
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/octet-stream"
          },
          timeout: 30000 // 30 second timeout
        }
      );
     
      console.log('📥 Response status:', response.status);
      console.log('📥 Response data:', JSON.stringify(response.data));
     
      // Handle different response formats
      let caption = '';
      if (Array.isArray(response.data) && response.data.length > 0) {
        caption = response.data[0]?.generated_text || '';
      } else if (response.data.error) {
        // Model is loading
        console.log('⏳ Model is loading, please wait...');
        throw new Error('Model is still loading. Please try again in a few seconds.');
      }
     
      console.log('🤖 AI Caption:', caption);
     
      // Parse the caption to extract clothing items
      const detectedItems = parseClothingFromCaption(caption);
     
      console.log('✅ Detected', detectedItems.length, 'items');
     
      res.json({
        success: true,
        items: detectedItems,
        total: detectedItems.length,
        message: 'Detection complete (FREE AI-powered by Hugging Face)'
      });
     
    } catch (aiError) {
        console.error('AI API Error Details:', {
          message: aiError.message,
          status: aiError.response?.status,
          data: aiError.response?.data
        });
      
        // If it's a 503 or model loading error, give helpful message
        if (aiError.response?.status === 503 || aiError.message.includes('loading')) {
          throw new Error('AI model is warming up. Please wait 10-20 seconds and try again.');
        }
      
        throw aiError;
    }
   
  } catch (error) {
      console.error('❌ Error:', error.message);
    
      // Fallback to mock data on error
      const detectedItems = generateClothingData();
      res.json({
        success: true,
        items: detectedItems,
        total: detectedItems.length,
        message: 'Detection complete (fallback to mock data due to API error)'
      });
  }
});

// ============================================
// Profile picture
// ============================================

// Upload profile picture
app.post('/api/profile/upload-picture', requireLogin, uploadProfilePic.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const userId = req.session.userId;
    const profilePicUrl = `/assets/images/profile-pictures/${req.file.filename}`;

    // Get old profile picture to delete it
    const user = await db.get('SELECT profile_picture FROM users WHERE id = ?', [userId]);
    
    // Update database with new profile picture
    await db.run(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [profilePicUrl, userId]
    );

    // Delete old profile picture if it exists
    if (user.profile_picture) {
      const oldPicPath = path.join(ROOT, user.profile_picture);
      try {
        await fs.unlink(oldPicPath);
      } catch (error) {
        console.log('Could not delete old profile picture:', error);
      }
    }

    res.json({
      success: true,
      message: 'Profile picture updated!',
      profilePicture: profilePicUrl
    });

  } catch (error) {
    console.error('❌ Error uploading profile picture:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload profile picture: ' + error.message 
    });
  }
});

// Delete profile picture
app.delete('/api/profile/delete-picture', requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;

    // Get current profile picture
    const user = await db.get('SELECT profile_picture FROM users WHERE id = ?', [userId]);
    
    if (user.profile_picture) {
      // Delete the file
      const picPath = path.join(ROOT, user.profile_picture);
      try {
        await fs.unlink(picPath);
      } catch (error) {
        console.log('Could not delete profile picture file:', error);
      }

      // Remove from database
      await db.run('UPDATE users SET profile_picture = NULL WHERE id = ?', [userId]);
    }

    res.json({
      success: true,
      message: 'Profile picture removed'
    });

  } catch (error) {
    console.error('❌ Error deleting profile picture:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete profile picture' 
    });
  }
});

// ============================================
// User profile
// ============================================

app.get("/api/profile/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const user = await db.get(
      "SELECT id, name, username, email, bio, location, birthday, profile_picture FROM users WHERE id = ?",
      [userId]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get user's posts count
    const imagesJsonPath = path.join(DATA, 'images.json');
    let postsCount = 0;
    try {
      const fileContent = await fs.readFile(imagesJsonPath, 'utf-8');
      const imagesData = JSON.parse(fileContent);
      postsCount = imagesData.filter(img => img.userId === parseInt(userId)).length;
    } catch (error) {
      console.log('No posts found');
    }

    res.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        username: user.username,
        bio: user.bio || '',
        location: user.location || '',
        profilePicture: user.profile_picture || null,
        postsCount: postsCount,
        followersCount: 0,
        followingCount: 0
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// Get user's posts by user ID
app.get("/api/profile/:userId/posts", async (req, res) => {
  try {
    const userId = req.params.userId;
    const imagesJsonPath = path.join(DATA, 'images.json');
    
    const fileContent = await fs.readFile(imagesJsonPath, 'utf-8');
    const imagesData = JSON.parse(fileContent);

    // Filter posts by user ID
    const userPosts = imagesData.filter(img => img.userId === parseInt(userId));

    res.json({
      success: true,
      posts: userPosts
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
});

// ============================================
// POST INTERACTION ROUTES
// ============================================

// Like/Unlike a post
app.post('/api/posts/like', requireLogin, async (req, res) => {
  try {
    const { postUrl, action } = req.body;
    const userId = req.session.userId;

    if (!postUrl) {
      return res.status(400).json({ success: false, message: 'Post URL required' });
    }

    if (action === 'like') {
      // Add like (ignore if already exists)
      await db.run(
        'INSERT OR IGNORE INTO post_likes (user_id, post_url) VALUES (?, ?)',
        [userId, postUrl]
      );
    } else if (action === 'unlike') {
      // Remove like
      await db.run(
        'DELETE FROM post_likes WHERE user_id = ? AND post_url = ?',
        [userId, postUrl]
      );
    }

    // Get updated like count
    const result = await db.get(
      'SELECT COUNT(*) as count FROM post_likes WHERE post_url = ?',
      [postUrl]
    );

    res.json({ 
      success: true, 
      likes: result.count,
      isLiked: action === 'like'
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Failed to update like' });
  }
});

// Repost/Unrepost a post
app.post('/api/posts/repost', requireLogin, async (req, res) => {
  try {
    const { postUrl, action } = req.body;
    const userId = req.session.userId;

    if (!postUrl) {
      return res.status(400).json({ success: false, message: 'Post URL required' });
    }

    if (action === 'repost') {
      // Add repost
      await db.run(
        'INSERT OR IGNORE INTO post_reposts (user_id, post_url) VALUES (?, ?)',
        [userId, postUrl]
      );
    } else if (action === 'unrepost') {
      // Remove repost
      await db.run(
        'DELETE FROM post_reposts WHERE user_id = ? AND post_url = ?',
        [userId, postUrl]
      );
    }

    // Get updated repost count
    const result = await db.get(
      'SELECT COUNT(*) as count FROM post_reposts WHERE post_url = ?',
      [postUrl]
    );

    res.json({ 
      success: true, 
      reposts: result.count,
      isReposted: action === 'repost'
    });
  } catch (error) {
    console.error('Error toggling repost:', error);
    res.status(500).json({ success: false, message: 'Failed to update repost' });
  }
});

// Save/Unsave a post
app.post('/api/posts/save', requireLogin, async (req, res) => {
  try {
    const { postUrl, action } = req.body;
    const userId = req.session.userId;

    if (!postUrl) {
      return res.status(400).json({ success: false, message: 'Post URL required' });
    }

    if (action === 'save') {
      // Add save
      await db.run(
        'INSERT OR IGNORE INTO post_saves (user_id, post_url) VALUES (?, ?)',
        [userId, postUrl]
      );
    } else if (action === 'unsave') {
      // Remove save
      await db.run(
        'DELETE FROM post_saves WHERE user_id = ? AND post_url = ?',
        [userId, postUrl]
      );
    }

    // Get updated save count
    const result = await db.get(
      'SELECT COUNT(*) as count FROM post_saves WHERE post_url = ?',
      [postUrl]
    );

    res.json({ 
      success: true, 
      saves: result.count,
      isSaved: action === 'save'
    });
  } catch (error) {
    console.error('Error toggling save:', error);
    res.status(500).json({ success: false, message: 'Failed to update save' });
  }
});

// Get user's interaction state for a post
app.get('/api/posts/interactions/:postUrl', requireLogin, async (req, res) => {
  try {
    const postUrl = decodeURIComponent(req.params.postUrl);
    const userId = req.session.userId;

    const [liked, reposted, saved, likesCount, repostsCount, savesCount] = await Promise.all([
      db.get('SELECT id FROM post_likes WHERE user_id = ? AND post_url = ?', [userId, postUrl]),
      db.get('SELECT id FROM post_reposts WHERE user_id = ? AND post_url = ?', [userId, postUrl]),
      db.get('SELECT id FROM post_saves WHERE user_id = ? AND post_url = ?', [userId, postUrl]),
      db.get('SELECT COUNT(*) as count FROM post_likes WHERE post_url = ?', [postUrl]),
      db.get('SELECT COUNT(*) as count FROM post_reposts WHERE post_url = ?', [postUrl]),
      db.get('SELECT COUNT(*) as count FROM post_saves WHERE post_url = ?', [postUrl])
    ]);

    res.json({
      success: true,
      isLiked: !!liked,
      isReposted: !!reposted,
      isSaved: !!saved,
      likes: likesCount.count,
      reposts: repostsCount.count,
      saves: savesCount.count
    });
  } catch (error) {
    console.error('Error getting interactions:', error);
    res.status(500).json({ success: false, message: 'Failed to get interactions' });
  }
});

// Get user's liked posts
app.get('/api/posts/liked', requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const liked = await db.all(
      'SELECT post_url, created_at FROM post_likes WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({ success: true, posts: liked });
  } catch (error) {
    console.error('Error fetching liked posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch liked posts' });
  }
});

// Get user's saved posts
app.get('/api/posts/saved', requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const saved = await db.all(
      'SELECT post_url, created_at FROM post_saves WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({ success: true, posts: saved });
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch saved posts' });
  }
});

// Get user's reposted posts
app.get('/api/posts/reposted', requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const reposted = await db.all(
      'SELECT post_url, created_at FROM post_reposts WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({ success: true, posts: reposted });
  } catch (error) {
    console.error('Error fetching reposted posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reposted posts' });
  }
});

// ============================================
// POST CREATION ROUTES
// ============================================

// Create new post
app.post('/api/posts', requireLogin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const { caption, gender, style, season, wardrobeItems } = req.body;
    
    const genderTags = gender ? JSON.parse(gender) : [];
    const styleTags = style ? JSON.parse(style) : [];
    const seasonTags = season ? JSON.parse(season) : [];
    const wardrobeItemIds = wardrobeItems ? JSON.parse(wardrobeItems) : [];

    const imageUrl = `/assets/images/outfits/user-posts/${req.file.filename}`;

    // Get user info including profile picture
    const user = await db.get('SELECT name, username, profile_picture FROM users WHERE id = ?', [req.session.userId]);

    // Get full wardrobe item details
    let wardrobeItemsData = [];
    if (wardrobeItemIds.length > 0) {
      const placeholders = wardrobeItemIds.map(() => '?').join(',');
      wardrobeItemsData = await db.all(
        `SELECT id, name, category, brand, color, size, price, image FROM wardrobe WHERE id IN (${placeholders}) AND user_id = ?`,
        [...wardrobeItemIds, req.session.userId]
      );
    }

    const imagesJsonPath = path.join(DATA, 'images.json');
    let imagesData = [];
    
    try {
      const fileContent = await fs.readFile(imagesJsonPath, 'utf-8');
      imagesData = JSON.parse(fileContent);
    } catch (error) {
      console.log('Creating new images.json file');
      imagesData = [];
    }

    const newEntry = {
      url: imageUrl,
      caption: caption || '',
      timestamp: new Date().toISOString(),
      userId: req.session.userId,
      userName: user.username || user.name,
      userProfilePic: user.profile_picture,
      page: ["fyp"],
      Gender: genderTags,
      Style: styleTags,
      Season: seasonTags,
      wardrobeItems: wardrobeItemsData // Add full wardrobe item details
    };

    imagesData.push(newEntry);

    await fs.writeFile(imagesJsonPath, JSON.stringify(imagesData, null, 2));

    res.json({
      success: true,
      message: 'Post created successfully!',
      post: newEntry
    });

  } catch (error) {
    console.error('❌ Error creating post:', error);
    
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create post: ' + error.message 
    });
  }
});

// update
app.put('/api/posts/update', requireLogin, async (req, res) => {
  try {
    const { postUrl, caption, gender, style, season, wardrobeItemIds } = req.body;
    const userId = req.session.userId;

    // Get wardrobe item details
    let wardrobeItemsData = [];
    if (wardrobeItemIds && wardrobeItemIds.length > 0) {
      const placeholders = wardrobeItemIds.map(() => '?').join(',');
      wardrobeItemsData = await db.all(
        `SELECT id, name, category, brand, color, size, price, image FROM wardrobe WHERE id IN (${placeholders}) AND user_id = ?`,
        [...wardrobeItemIds, userId]
      );
    }

    // Read images.json
    const imagesJsonPath = path.join(DATA, 'images.json');
    const fileContent = await fs.readFile(imagesJsonPath, 'utf-8');
    let imagesData = JSON.parse(fileContent);

    // Find and update the post
    const postIndex = imagesData.findIndex(img => img.url === postUrl && img.userId === userId);
    
    if (postIndex === -1) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Update the post data
    imagesData[postIndex] = {
      ...imagesData[postIndex],
      caption: caption || '',
      Gender: gender || [],
      Style: style || [],
      Season: season || [],
      wardrobeItems: wardrobeItemsData
    };

    // Write back to file
    await fs.writeFile(imagesJsonPath, JSON.stringify(imagesData, null, 2));

    res.json({
      success: true,
      message: 'Post updated successfully!',
      post: imagesData[postIndex]
    });

  } catch (error) {
    console.error('❌ Error updating post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update post: ' + error.message 
    });
  }
});

// Get user's posts
app.get('/api/posts', requireLogin, async (req, res) => {
  try {
    const imagesJsonPath = path.join(DATA, 'images.json');
    const fileContent = await fs.readFile(imagesJsonPath, 'utf-8');
    const imagesData = JSON.parse(fileContent);

    // Filter posts by current user
    const userPosts = imagesData.filter(img => img.userId === req.session.userId);

    res.json({
      success: true,
      posts: userPosts
    });
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
});

// Delete a post
app.delete('/api/posts/:filename', requireLogin, async (req, res) => {
  try {
    const filename = req.params.filename;
    const userId = req.session.userId;

    // Read images.json
    const imagesJsonPath = path.join(DATA, 'images.json');
    const fileContent = await fs.readFile(imagesJsonPath, 'utf-8');
    let imagesData = JSON.parse(fileContent);

    // Find the post
    const postIndex = imagesData.findIndex(
      img => img.url.includes(filename) && img.userId === userId
    );

    if (postIndex === -1) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const post = imagesData[postIndex];

    // Delete the image file
    const imagePath = path.join(ROOT, post.url);
    try {
      await fs.unlink(imagePath);
    } catch (error) {
      console.warn('Could not delete image file:', error);
    }

    // Remove from array
    imagesData.splice(postIndex, 1);

    // Write back to file
    await fs.writeFile(imagesJsonPath, JSON.stringify(imagesData, null, 2));

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting post:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});


// ============================================
// AUTHENTICATION ROUTES
// ============================================


// ✅ Login route
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate inputs early
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Missing username or password" });
    }

    // Find user in database
    const user = await db.get("SELECT * FROM users WHERE email = ?", [username]);
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    // Check password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    // Create session
    req.session.userId = user.id;

    // ✅ Send JSON response
    res.json({
      success: true,
      message: "Login successful!",
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});


// Signup route
app.post("/signup", async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name)
    return res.status(400).json({success: false, message: "missing name-required"});
  if (!username)
    return res.status(400).json({success: false, message: "missing username-required"});
  if (!email)
    return res.status(400).json({success: false, message: "missing email-required"});
  if (!password)
    return res.status(400).json({success: false, message: "missing password-required"});


  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/; // letters, numbers, underscores, 3-20 chars
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/; // min 8 chars, 1 uppercase, 1 lowercase, 1 number
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  if (!usernameRegex.test(username)) {
    return res.status(400).json({ success: false, message: "invalid username" });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "invalid email"});
  }
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ success: false, message: "invalid password" });
  }


  const hashed = await bcrypt.hash(password, 10);
  try {
    // Check if email or username already exists
    const existingUser = await db.get(
      "SELECT username, email FROM users WHERE username = ? OR email = ?",
      [username, email]
    );


    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({
          success: false,
          message: "exists username",
        });
      }
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: "exists email",
        });
      }
    }


    const result = await db.run(
      "INSERT INTO users (name, username, email, bio, location, birthday, shirt_size, waist_size, chest_size, shoe_size, inseam, height, dark_mode, push_notifications, email_updates, private_profile, show_size_recommendations, preferred_style, hide_saved_content, show_following, show_followers, language, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, username, email, "", "", "", "", "", "", "", "", "", "false", "false", "false", "false", "false", "", "true", "true", "true", "english", hashed]
    );


    req.session.userId = result.lastID; // store user session
    await req.session.save();
    // ✅ Send a clear JSON response for the client to detect
    res.json({ success: true, message: "Account created successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Check login status
app.get("/check-login", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.json({ loggedIn: false });
    }

    const user = await db.get(
      "SELECT name, username, email, bio, location, birthday, shirt_size, waist_size, chest_size, " + 
      "shoe_size, inseam, height, dark_mode, push_notifications, email_updates, private_profile, " +
      "show_size_recommendations, preferred_style, profile_picture, hide_saved_content, " +
      "show_following, show_followers, language FROM users WHERE id = ?", 
      [req.session.userId]
    );

    if (!user) {
      req.session.destroy(() => {});
      return res.json({ loggedIn: false });
    }

    res.json({
      loggedIn: true,
      user: {
        id: req.session.userId,
        username: user.username,
        email: user.email,
        name: user.name,
        bio: user.bio,
        location: user.location,
        birthday: user.birthday,
        shirt_size: user.shirt_size,
        waist_size: user.waist_size,
        chest_size: user.chest_size,
        shoe_size: user.shoe_size,
        inseam: user.inseam,
        height: user.height,
        dark_mode: user.dark_mode,
        push_notifications: user.push_notifications,
        email_updates: user.email_updates,
        private_profile: user.private_profile,
        show_size_recommendations: user.show_size_recommendations,
        preferred_style: user.preferred_style,
        profile_picture: user.profile_picture,
        hide_saved_content: user.hide_saved_content,
        show_following: user.show_following,
        show_followers: user.show_followers,
        language: user.language
      },
    });
  } catch (err) {
    console.error("Error in /check-login:", err);
    res.status(500).json({ loggedIn: false, error: "Server error" });
  }
});


// ✅ Logout route
app.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ success: false, message: "Logout failed" });
      }
      res.clearCookie("connect.sid"); // clears the session cookie
      res.json({ success: true, message: "Logged out successfully" });
    });
  } else {
    res.json({ success: true, message: "No session to clear" });
  }
});

// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, message: "User not logged in" });
  }
  next();
}

app.put("/update-user", async (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const { // Basic info
        name, username, email, bio, location, birthday, 
        // Measurements
        shirt_size, waist_size, chest_size, shoe_size, inseam, height, 
        // Preferences
        dark_mode, push_notifications, email_updates, private_profile, 
        show_size_recommendations, preferred_style, hide_saved_content,
        show_following, show_followers, language } = req.body;

    if (!name || !username ) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    await db.run(
      "UPDATE users SET name = ?, username = ?, email = ?, bio = ?, location = ?, birthday = ?, shirt_size = ?, " + 
      "waist_size = ?, chest_size = ?, shoe_size = ?, inseam = ?, height = ?, dark_mode = ?, push_notifications = ?, " + 
      "email_updates = ?, private_profile = ?, show_size_recommendations = ?, preferred_style = ?, " +
      "hide_saved_content = ?, show_following = ?, show_followers = ?, language = ? WHERE id = ?",
      [
        name, username, email, bio, location, birthday, shirt_size, 
        waist_size, chest_size, shoe_size, inseam, height, dark_mode, 
        push_notifications, email_updates, private_profile, 
        show_size_recommendations, preferred_style, hide_saved_content,
        show_following, show_followers, language, req.session.userId
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ============================================
// Put On Routes
// ============================================

app.post("/api/putons", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const { name, type, brand, color, size, price, image, category, notes, sourceImage } = req.body;

    await db.run(
      `INSERT INTO putons (user_id, name, type, brand, color, size, price, image, category, notes, source_image, added_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [req.session.userId, name, type, brand, color, size, price, image, category, notes, sourceImage]
    );

    res.json({ success: true, message: "Put on added successfully!" });
  } catch (err) {
    console.error("Error adding put on:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ✅ Get all "Put Ons" for the logged-in user
app.get("/api/putons", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const putons = await db.all(
      "SELECT * FROM putons WHERE user_id = ? ORDER BY added_at DESC",
      [userId]
    );
    res.json({ success: true, items: putons });
  } catch (err) {
    console.error("❌ Error fetching put on:", err);
    res.status(500).json({ success: false, message: "Failed to load put ons" });
  }
});

// ✅ Delete a put on
app.delete("/api/putons/:id", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const itemId = req.params.id;
    const result = await db.run(
      "DELETE FROM putons WHERE id = ? AND user_id = ?",
      [itemId, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, message: "Put on deleted" });
  } catch (err) {
    console.error("❌ Error deleting put on:", err);
    res.status(500).json({ success: false, message: "Failed to delete put on" });
  }
});


// ============================================
// Build outfit route ROUTES
// ============================================

app.post('/api/outfits', requireLogin, async (req, res) => {
  try {
    const { name, items } = req.body;
    const userId = req.session.userId;
    
    const result = await db.run(
      'INSERT INTO outfits (user_id, name, description) VALUES (?, ?, ?)',
      [userId, name, JSON.stringify(items)]
    );
    
    res.json({ success: true, outfitId: result.lastID });
  } catch (error) {
    console.error('Error saving outfit:', error);
    res.status(500).json({ success: false, message: 'Failed to save outfit' });
  }
});

// ============================================
// WISHLIST ROUTES
// ============================================

// ✅ Add new wishlist item
app.post("/api/wishlist", requireLogin, async (req, res) => {
  try {
    const { name, type, brand, color, size, price, image, category, notes } = req.body;
    const userId = req.session.userId;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: "Missing name or type" });
    }

    const addedAt = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO wishlist (user_id, name, type, brand, color, size, price, image, category, notes, addedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, type, brand, color, size, price, image, category, notes, addedAt]
    );

    res.json({
      success: true,
      message: "Item added to wishlist!",
      item: { id: result.lastID, name, type, brand, color, size, price, image, category, notes, addedAt }
    });
  } catch (err) {
    console.error("❌ Error adding wishlist item:", err);
    res.status(500).json({ success: false, message: "Failed to add wishlist item" });
  }
});

// ✅ Get all wishlist items for the logged-in user
app.get("/api/wishlist", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const items = await db.all("SELECT * FROM wishlist WHERE user_id = ? ORDER BY addedAt DESC", [userId]);
    res.json({ success: true, items });
  } catch (err) {
    console.error("❌ Error fetching wishlist:", err);
    res.status(500).json({ success: false, message: "Failed to load wishlist" });
  }
});

// ✅ Delete a wishlist item
app.delete("/api/wishlist/:id", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const itemId = req.params.id;
    const result = await db.run("DELETE FROM wishlist WHERE id = ? AND user_id = ?", [itemId, userId]);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    console.error("❌ Error deleting wishlist item:", err);
    res.status(500).json({ success: false, message: "Failed to delete item" });
  }
});

// ========================================
// ✅ Wardrobe Routes
// ========================================

// Add new item
app.post("/api/wardrobe", requireLogin, async (req, res) => {
  try {
    const { name, category, image, brand, color, size, price, material } = req.body;
    const userId = req.session.userId;

    if (!name || !image || !category) {
      return res.status(400).json({ success: false, message: "Missing name, category, or image" });
    }

    const addedDate = new Date().toISOString();

    const result = await db.run(
      `INSERT INTO wardrobe (user_id, name, category, image, brand, color, size, price, material, addedDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, category, image, brand || '', color || '', size || '', price || '', material || '', addedDate]
    );

    res.json({
      success: true,
      message: "Item added to wardrobe!",
      item: { 
        id: result.lastID, 
        name, 
        category, 
        image, 
        brand, 
        color, 
        size, 
        price, 
        material, 
        addedDate 
      }
    });
  } catch (err) {
    console.error("❌ Error adding wardrobe item:", err);
    res.status(500).json({ success: false, message: "Failed to add wardrobe item" });
  }
});

app.put("/api/wardrobe/:id", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const itemId = req.params.id;
    const { name, category, brand, color, size, price, material } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Item name is required" });
    }

    // Verify the item belongs to the user
    const existingItem = await db.get(
      "SELECT id FROM wardrobe WHERE id = ? AND user_id = ?",
      [itemId, userId]
    );

    if (!existingItem) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    await db.run(
      `UPDATE wardrobe 
       SET name = ?, category = ?, brand = ?, color = ?, size = ?, price = ?, material = ?
       WHERE id = ? AND user_id = ?`,
      [name, category || '', brand || '', color || '', size || '', price || '', material || '', itemId, userId]
    );

    res.json({
      success: true,
      message: "Item updated successfully!",
      item: { id: parseInt(itemId), name, category, brand, color, size, price, material }
    });
  } catch (err) {
    console.error("❌ Error updating wardrobe item:", err);
    res.status(500).json({ success: false, message: "Failed to update wardrobe item" });
  }
});

// Get all wardrobe items for logged-in user
app.get("/api/wardrobe", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const items = await db.all(
      "SELECT * FROM wardrobe WHERE user_id = ? ORDER BY addedDate DESC",
      [userId]
    );
    res.json({ success: true, items });
  } catch (err) {
    console.error("❌ Error fetching wardrobe:", err);
    res.status(500).json({ success: false, message: "Failed to load wardrobe items" });
  }
});

// Delete wardrobe item
app.delete("/api/wardrobe/:id", requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const itemId = req.params.id;
    const result = await db.run(
      "DELETE FROM wardrobe WHERE id = ? AND user_id = ?",
      [itemId, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    console.error("❌ Error deleting wardrobe item:", err);
    res.status(500).json({ success: false, message: "Failed to delete wardrobe item" });
  }
});

// Get all outfits
app.get('/api/outfits', requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Get all outfits for the user
    const outfits = await db.all(
      'SELECT * FROM outfits WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    // For each outfit, get its items
    const outfitsWithItems = await Promise.all(outfits.map(async (outfit) => {
      let items = [];
      
      if (outfit.description) {
        try {
          const parsedItems = JSON.parse(outfit.description);
          
          // Use the stored item data directly (includes the correct image URLs)
          items = parsedItems.map(item => ({
            id: item.itemId,
            name: item.itemName || 'Unknown Item',
            image: item.imageUrl, // This is the individual clothing piece image
            category: item.category
          }));
        } catch (parseError) {
          console.error('Error parsing outfit items:', parseError);
        }
      }
      
      return {
        id: outfit.id,
        name: outfit.name,
        created_at: outfit.created_at,
        items: items
      };
    }));
    
    res.json({ success: true, outfits: outfitsWithItems });
  } catch (error) {
    console.error('Error fetching outfits:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete an outfit
app.delete('/api/outfits/:id', requireLogin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const outfitId = req.params.id;
    await db.run('DELETE FROM outfits WHERE id = ? AND user_id = ?', [outfitId, userId]);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`\n✅ Server is running!`);
  console.log(`📍 Main server: http://localhost:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  / - Homepage`);
  console.log(`   GET  /test - Test clothing detection`);
  console.log(`   GET  /health - Check server status`);
  console.log(`   GET  /check-login - Check login status`);
  console.log(`   POST /api/detect-clothing - Detect clothing in images`);
  console.log(`   POST /login - User login`);
  console.log(`   POST /signup - User signup`);
  console.log(`   POST /logout - User logout`);
});
