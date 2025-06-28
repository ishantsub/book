const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Page = mongoose.model("Page", {
  number: Number,
  content: String
});

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

app.get("/", async (req, res) => {
  const pages = await Page.find().sort({ number: 1 });
  res.render("index", { pages, isAdmin: req.session.isAdmin });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    res.redirect("/");
  } else {
    res.send("Invalid credentials");
  }
});

app.get("/edit/:pageId", async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send("Unauthorized");

  const page = await Page.findById(req.params.pageId);
  res.render("edit", { page });
});

app.post("/edit/:pageId", async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send("Unauthorized");

  await Page.findByIdAndUpdate(req.params.pageId, { content: req.body.content });
  res.redirect("/");
});

app.post("/add", async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send("Unauthorized");

  const pageCount = await Page.countDocuments();
  const newPage = new Page({ number: pageCount + 1, content: "New page content here..." });
  await newPage.save();
  res.redirect("/");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));