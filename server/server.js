// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const axios = require('axios'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const Images = require('./model');
const User = require('./model1');

const app = express();
const PORT = 4000; 

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://322103312083:951509290@cluster0.8iess.mongodb.net/movie')
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('Error connecting to database:', err);
  });

// Cloudinary Configuration
cloudinary.config({
  cloud_name: 'dthh2uenu',
  api_key: '184761731987834',
  api_secret: '3BY0vtJkpgH7vJ527uMEsJ58tHs',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Uploads',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage: storage });

// JWT Secret
const JWT_SECRET = 'your_jwt_secret_key';

// --- CASHFREE API DETAILS ---
const cashfreeApiUrl = 'https://sandbox.cashfree.com/pg/orders';
const clientId = 'TEST1068960071da83c198337a44acfb00698601'
const CASHFREE_API_KEY = process.env.CASHFREE_API_KEY;
const apiVersion = '2023-08-01';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// --- CASHFREE ORDER CREATION ENDPOINT ---
app.post('/api/create-order', verifyToken, async (req, res) => {
  try {
    const { order_amount } = req.body; // Get order_amount from request body
    const orderId = `order_${Date.now()}`;

    // Fetch the user from the database using the userId from the JWT token
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const orderData = {
      order_id: orderId,
      order_amount: order_amount || 1.00, // Use provided amount or default to 1.00
      order_currency: 'INR',
      customer_details: {
        customer_id: user._id.toString(), // Use user ID as customer_id    
        customer_email: user.email, // Use user's email
        customer_phone: '9515096422', // You can make this dynamic if needed
      },
      order_meta: {
        return_url: `http://localhost:3000/success?order_id={order_id}`,
      },
      order_note: 'Test payment for an awesome product',
    };

    const headers = {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      'x-client-secret': clientSecret,
      'x-api-version': apiVersion,
    };

    const response = await axios.post(cashfreeApiUrl, orderData, { headers });
    console.log('Cashfree order creation response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating Cashfree order:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// --- E-COMMERCE ENDPOINTS ---
// Image Upload
app.post('/uploadimage', upload.single('image'), async (req, res) => {
  const imageUrl = req.file.path;
  const { name, price, grams, userName } = req.body;

  try {
    await Images.create({
      image: imageUrl,
      name: name,
      price: price,
      grams: grams,
      userName: userName,
    });
    
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).send('Error uploading image: ' + error.message);
  }
});

// Get Images
app.get('/getimage', async (req, res) => {
  try {
    const data = await Images.find({});
    res.json({ status: 'ok', data: data });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching images' });
  }
});

// Sign Up
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ error: 'Something went wrong on the server' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Something went wrong on the server' });
  }
});

// Profile


app.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});