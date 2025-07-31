const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const productsPath = path.join(__dirname, "../../db/products.json");

router.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const products = JSON.parse(fs.readFileSync(productsPath));
  res.render("index", { products, cartCount: req.session.cart?.length || 0 });
});

router.post("/add-to-cart", (req, res) => {
  const { productId } = req.body;
  const products = JSON.parse(fs.readFileSync(productsPath));
  const product = products.find(p => p.id == productId);
  if (product) {
    req.session.cart.push(product);
  }
  res.redirect("/products");
});

module.exports = router;
