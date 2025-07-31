const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const usersPath = path.join(__dirname, "../../db/users.json");

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || req.cookies.token;
    if (!token) return res.redirect('/login');
    jwt.verify(token, process.env.JWT_SECRET || 'maxfiy_kalit_uzoq_bolsin', (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        next();
    });
};

router.get("/", authenticateToken, (req, res) => {
    res.redirect("/products");
});

router.get("/register", (req, res) => {
    res.render("register");
});

router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    let users = JSON.parse(fs.readFileSync(usersPath));
    if (users.find(u => u.username === username)) {
        return res.send("Bu foydalanuvchi allaqachon mavjud!");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    res.redirect("/login");
});

router.get("/login", (req, res) => {
    res.render("login");
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync(usersPath));
    const user = users.find(u => u.username === username);
    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.send("Login yoki parol noto‘g‘ri!");
    }
    const token = jwt.sign({ username, cart: [] }, process.env.JWT_SECRET || 'maxfiy_kalit_uzoq_bolsin', { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect("/products");
});

router.get("/logout", (req, res) => {
    res.clearCookie('token');
    res.redirect("/login");
});

module.exports = router;