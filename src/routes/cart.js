const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');

const productsFile = path.join(__dirname, '../db/products.json');


const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || req.cookies.token;
    if (!token) return res.redirect('/login');
    jwt.verify(token, process.env.JWT_SECRET || 'maxfiy_kalit_uzoq_bolsin', (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        next();
    });
};

router.post('/add-to-cart', authenticateToken, (req, res) => {
    const productId = parseInt(req.body.productId);
    console.log('Qo\'shilayotgan productId:', productId); // Debug
    if (!req.user.cart) req.user.cart = {};
    if (!req.user.cart[productId]) req.user.cart[productId] = 0;
    req.user.cart[productId]++;
    console.log('Yangilangan cart:', req.user.cart); // Debug
    const token = jwt.sign(req.user, process.env.JWT_SECRET || 'maxfiy_kalit_uzoq_bolsin', { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/products');
});

router.get('/cart', authenticateToken, async (req, res) => {
    const cart = req.user.cart || {};
    console.log('Cart session:', cart); // Debug
    const products = JSON.parse(await fs.readFile(productsFile, 'utf-8'));
    const cartItems = Object.entries(cart).map(([id, quantity]) => {
        const product = products.find(p => p.id === parseInt(id));
        return product ? { ...product, quantity } : null;
    }).filter(item => item !== null);
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.render('cart', { cartItems, total, cartCount: Object.keys(cart).length });
});

router.post('/delete', authenticateToken, (req, res) => {
    const productId = parseInt(req.body.productId);
    if (req.user.cart && req.user.cart[productId]) {
        delete req.user.cart[productId];
        if (Object.keys(req.user.cart).length === 0) delete req.user.cart;
    }
    const token = jwt.sign(req.user, process.env.JWT_SECRET || 'maxfiy_kalit_uzoq_bolsin', { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/cart');
});

router.post('/add-more', authenticateToken, (req, res) => {
    const productId = parseInt(req.body.productId);
    if (!req.user.cart) req.user.cart = {};
    if (!req.user.cart[productId]) req.user.cart[productId] = 0;
    req.user.cart[productId]++;
    const token = jwt.sign(req.user, process.env.JWT_SECRET || 'maxfiy_kalit_uzoq_bolsin', { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/cart');
});

module.exports = router;