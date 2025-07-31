const fs = require('fs');
   require('dotenv').config();
   const express = require('express');
   const bcrypt = require('bcryptjs');
   const jwt = require('jsonwebtoken');
   const path = require('path');
   const app = express();

   
   app.use(express.static(path.join(__dirname, '../public')));
   app.use(express.urlencoded({ extended: true }));
   app.set('views', path.join(__dirname, 'views'));
   app.set('view engine', 'ejs');

   
   let users = [];
   const dbPath = path.join(__dirname, 'db');
   const usersFilePath = path.join(dbPath, 'users.json');
   if (!fs.existsSync(dbPath)) {
       fs.mkdirSync(dbPath);
   }
   if (!fs.existsSync(usersFilePath)) {
       fs.writeFileSync(usersFilePath, '[]');
   }
   if (fs.existsSync(usersFilePath)) {
       try {
           const usersData = fs.readFileSync(usersFilePath, 'utf8');
           users = usersData.trim() === '' ? [] : JSON.parse(usersData);
       } catch (err) {
           console.error('users.json o\'qishda xatolik:', err);
           users = [];
       }
   } else {
       fs.writeFileSync(usersFilePath, '[]');
   }

  
   const products = [
       { id: 1, name: "Telefon", price: 2000000, image: '/images/Iphone.jpg' },
       { id: 2, name: "Noutbuk", price: 3500000, image: '/images/laptop.jpg' },
       { id: 3, name: "Planshet", price: 1500000, image: '/images/tablet.jpg' },
       { id: 4, name: "Smart Watch", price: 800000, image: '/images/smartwatch.jpg' },
       { id: 5, name: "Kamera", price: 1200000, image: '/images/camera.jpg' },
       { id: 6, name: "Quloqchin", price: 500000, image: '/images/earphones.jpg' },
       { id: 7, name: "Joystik", price: 2500000, image: '/images/djoystik.jpg' },
       { id: 8, name: "Televizor", price: 4000000, image: '/images/televisor.jpg' },
       { id: 9, name: "PlayStation", price: 3000000, image: '/images/playstation.jpg' },
       { id: 10, name: "Konditsioner", price: 5000000, image: '/images/konditsioner.jpg' },
       { id: 11, name: "Printer", price: 1000000, image: '/images/printer.jpg' },
       { id: 12, name: "Router", price: 600000, image: '/images/router.jpg' },
       { id: 13, name: "USB Flash Drive", price: 200000, image: '/images/usb.jpg' },
       { id: 14, name: "Monitor", price: 1800000, image: '/images/monitor.jpg' },
       { id: 16, name: "Sichqoncha", price: 250000, image: '/images/sichqoncha.jpg' },
       { id: 17, name: "Web Kamera", price: 700000, image: '/images/webcam.jpg' },
   ];


   const productsFilePath = path.join(dbPath, 'products.json');
   if (!fs.existsSync(productsFilePath)) {
       fs.writeFileSync(productsFilePath, '[]');
   }

   
   function isValidEmail(email) {
       const emailRegex = /^[^\s@]+@[^\s@]+\.(com|org|net|edu)$/i;
       return emailRegex.test(email);
   }

   
   const authenticateToken = (req, res, next) => {
       const token = req.headers['authorization']?.split(' ')[1] || req.cookies.token;
       if (!token) return res.redirect('/login');
       jwt.verify(token, process.env.JWT_SECRET || 'maxfiy_kalit_uzoq_bolsin', (err, user) => {
           if (err) return res.redirect('/login');
           req.user = user;
           next();
       });
   };

   
   app.get('/', (req, res) => {
       res.redirect('/register');
   });

   
   app.get('/products', authenticateToken, (req, res) => {
       const searchQuery = req.query.search || '';
       const filteredProducts = products.filter(p => 
           p.name.toLowerCase().includes(searchQuery.toLowerCase())
       );
       const cartCount = req.user?.cart ? Object.keys(req.user.cart).length : 0;
       res.render('index', { products: filteredProducts, cartCount, user: req.user });
   });

 
   app.get('/login', (req, res) => {
       res.render('login', { error: null, cartCount: req.user?.cart ? Object.keys(req.user.cart).length : 0 });
   });

  
   app.post('/login', async (req, res) => {
       const { email, password } = req.body;
       if (!email || !password) {
           return res.render('login', { error: 'Iltimos, barcha maydonlarni to\'ldiring!', cartCount: 0 });
       }
       if (!isValidEmail(email)) {
           return res.render('login', { error: 'Iltimos, to\'liq va haqiqiy email kiriting (masalan, user@gmail.com)!', cartCount: 0 });
       }
       const user = users.find(u => u.email === email);
       if (user && await bcrypt.compare(password, user.password)) {
           const token = jwt.sign({ email, cart: user.cart || {} }, process.env.JWT_SECRET || 'maxfiy_kalit_uzoq_bolsin', { expiresIn: '1h' });
           res.cookie('token', token, { httpOnly: true });
           res.redirect('/products');
       } else {
           res.render('login', { error: 'Noto\'g\'ri email yoki parol!', cartCount: 0 });
       }
   });

  
   app.get('/register', (req, res) => {
       res.render('register', { error: null, cartCount: req.user?.cart ? Object.keys(req.user.cart).length : 0 });
   });

   
   app.post('/register', async (req, res) => {
       const { username, email, password } = req.body;
       if (!username || !email || !password) {
           return res.render('register', { error: 'Iltimos, barcha maydonlarni to\'ldiring!', cartCount: 0 });
       }
       if (!isValidEmail(email)) {
           return res.render('register', { error: 'Iltimos, to\'liq va haqiqiy email kiriting (masalan, user@gmail.com)!', cartCount: 0 });
       }
       if (username.length < 8) {
           return res.render('register', { error: 'Kamida 8 tadan ko\'p belgi kiriting!', cartCount: 0 });
       }
       if (users.find(u => u.email === email)) {
           return res.render('register', { error: 'Bu email allaqachon ro\'yxatdan o\'tgan!', cartCount: 0 });
       }
       const hashedPassword = await bcrypt.hash(password, 10);
       users.push({ username, email, password: hashedPassword, cart: {} });
       try {
           fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
           console.log('Yangi user qo\'shildi:', { username, email });
       } catch (err) {
           console.error('Faylga yozishda xatolik:', err);
           return res.render('register', { error: 'Faylga yozishda xatolik yuz berdi!', cartCount: 0 });
       }
       const token = jwt.sign({ email, cart: {} }, process.env.JWT_SECRET || 'maxfiy_kalit_uzoq_bolsin', { expiresIn: '1h' });
       res.cookie('token', token, { httpOnly: true });
       res.redirect('/products');
   });

  
   app.get('/logout', (req, res) => {
       res.clearCookie('token');
       res.redirect('/register');
   });

   
   app.post('/products/add-to-cart', authenticateToken, (req, res) => {
       const productId = parseInt(req.body.productId);
       if (!req.user.cart) req.user.cart = {};
       if (!req.user.cart[productId]) req.user.cart[productId] = 0;
       req.user.cart[productId]++;
       const token = jwt.sign(req.user, process.env.JWT_SECRET || 'maxfiy_kalit_uzoq_bolsin', { expiresIn: '1h' });
       res.cookie('token', token, { httpOnly: true });
       res.redirect('/products');
   });

   
   app.get('/cart', authenticateToken, async (req, res) => {
       const cart = req.user.cart || {};
       const products = JSON.parse(await fs.readFile(productsFilePath, 'utf-8'));
       const cartItems = Object.entries(cart).map(([id, quantity]) => {
           const product = products.find(p => p.id === parseInt(id));
           return product ? { ...product, quantity } : null;
       }).filter(item => item !== null);
       const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
       if (cartItems.length > 0) {
           try {
               fs.writeFileSync(productsFilePath, JSON.stringify(cartItems, null, 2));
           } catch (err) {
               console.error('Faylga yozishda xatolik:', err);
               return res.render('cart', { cartItems, total, cartCount: Object.keys(cart).length, error: 'Faylga yozishda xatolik yuz berdi!' });
           }
       }
       res.render('cart', { cartItems, total, cartCount: Object.keys(cart).length });
   });

   
   app.post('/cart/delete', authenticateToken, (req, res) => {
       const productId = parseInt(req.body.productId);
       if (req.user.cart && req.user.cart[productId]) {
           delete req.user.cart[productId];
           if (Object.keys(req.user.cart).length === 0) delete req.user.cart;
       }
       const token = jwt.sign(req.user, process.env.JWT_SECRET || 'maxfiy_kalit_uzoq_bolsin', { expiresIn: '1h' });
       res.cookie('token', token, { httpOnly: true });
       res.redirect('/cart');
   });

   
   app.post('/cart/add-more', authenticateToken, (req, res) => {
       const productId = parseInt(req.body.productId);
       if (!req.user.cart) req.user.cart = {};
       if (!req.user.cart[productId]) req.user.cart[productId] = 0;
       req.user.cart[productId]++;
       const token = jwt.sign(req.user, process.env.JWT_SECRET || 'maxfiy_kalit_uzoq_bolsin', { expiresIn: '1h' });
       res.cookie('token', token, { httpOnly: true });
       res.redirect('/cart');
   });

  
   const PORT = process.env.PORT || 8000;
   app.listen(PORT, () => {
       console.log(`Server ${PORT}-portda ishga tushdi`);
   });
   console.log(authHeader.split(' '))