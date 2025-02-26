const Book = require("../models/book");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookConfig = JSON.parse(req.body.book);
  delete req.body._id;
  delete req.body._userId;

  const book = new Book({
    ...bookConfig,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Objet enregistré !" });
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};

exports.createRating = (req, res, next) => {
  const rating = req.body.rating;
  const bookId = req.params.id;
  const userId = req.auth.userId;

  if (rating < 0 || rating > 5) {
    return res
      .status(400)
      .json({ error: "La note doit être comprise entre 0 et 5" });
  }

  Book.findOne({ _id: bookId })
    .then((book) => {
      const userRatingIndex = book.ratings.findIndex(
        (rating) => rating.userId === userId
      );

      if (userRatingIndex !== -1) {
        book.ratings[userRatingIndex].grade = rating;
      } else {
        book.ratings.push({
          userId: userId,
          grade: rating,
        });
      }

      // Calculate average rating
      const sum = book.ratings.reduce((acc, curr) => acc + curr.grade, 0);
      book.averageRating = sum / book.ratings.length;

      // Save updated book
      return book.save();
    })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getBestRating = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(404).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(404).json({ error }));
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: "Livre non trouvé" });
      }
      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ error: "Requête interdite" });
      }

      const filename = book.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Livre supprimé" }))
          .catch((error) => res.status(404).json({ error }));
      });
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: "Livre non trouvé" });
      }
      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ error: "Requête interdite" });
      }

      // If there's a new image, delete the old one
      if (req.file) {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, (err) => {
          if (err)
            console.log(
              "Erreur lors de la suppression de l'ancienne image:",
              err
            );
        });
      }

      Book.updateOne(
        { _id: req.params.id },
        { ...bookObject, _id: req.params.id }
      )
        .then(() => res.status(200).json({ message: "Livre mis à jour" }))
        .catch((error) => res.status(404).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
