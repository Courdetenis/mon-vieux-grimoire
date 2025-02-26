const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const booksController = require("../controllers/books");

router.get("/", booksController.getAllBooks);
router.get("/bestrating", booksController.getBestRating);
router.get("/:id", booksController.getOneBook);
router.post("/", auth, upload, booksController.createBook);
router.post("/:id/rating", auth, booksController.createRating);
router.put("/:id", auth, upload, upload, booksController.modifyBook);
router.delete("/:id", auth, booksController.deleteBook);

module.exports = router;
