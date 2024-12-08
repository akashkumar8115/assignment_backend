const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const HistoryBook = require("../models/HistoryBook");

// Ensure uploads directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer configuration
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter
});

// Error handler middleware
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes
router.post("/", upload.single('image'), asyncHandler(async (req, res) => {
    const { bookName, authorName, price } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newBook = new HistoryBook({
        bookName,
        authorName,
        price: parseFloat(price),
        imageUrl
    });

    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
}));

router.get("/", asyncHandler(async (req, res) => {
    const books = await HistoryBook.find().sort({ createdAt: -1 });
    res.json(books);
}));

router.get("/:id", asyncHandler(async (req, res) => {
    const book = await HistoryBook.findById(req.params.id);
    if (!book) {
        return res.status(404).json({ error: "Book not found" });
    }
    res.json(book);
}));

router.put("/:id", upload.single('image'), asyncHandler(async (req, res) => {
    const { bookName, authorName, price } = req.body;
    const updateData = {
        bookName,
        authorName,
        price: parseFloat(price)
    };

    if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;

        // Delete old image if exists
        const oldBook = await HistoryBook.findById(req.params.id);
        if (oldBook?.imageUrl) {
            const oldImagePath = path.join(__dirname, '..', oldBook.imageUrl);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
    }

    const updatedBook = await HistoryBook.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );

    if (!updatedBook) {
        return res.status(404).json({ error: "Book not found" });
    }
    res.json(updatedBook);
}));


router.delete("/:id", asyncHandler(async (req, res) => {
    const book = await HistoryBook.findById(req.params.id);
    if (!book) {
        return res.status(404).json({ error: "Book not found" });
    }

    // Delete associated image if exists
    if (book.imageUrl) {
        const imagePath = path.join(__dirname, '..', book.imageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    await book.deleteOne();
    res.json({ message: "Book deleted successfully" });
}));










// router.post("/", asyncHandler(async (req, res) => {
//     const books = [
//         {
//             bookName: "The Great Gatsby",
//             authorName: "F. Scott Fitzgerald",
//             price: 10.99,
//             imageUrl: "https://www.svgrepo.com/show/94674/books-stack-of-three.svg"
//         },
//         {
//             bookName: "1984",
//             authorName: "George Orwell",
//             price: 14.99,
//             imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQK5115tOMjV9HPPMdZ5XrJDpphL0dleGtqUA&s"
//         },
//         {
//             bookName: "Sapiens: A Brief History of Humankind",
//             authorName: "Yuval Noah Harari",
//             price: 18.99,
//             imageUrl: "https://img.freepik.com/free-vector/hand-drawn-flat-education-illustration-book-set_23-2151358291.jpg?semt=ais_hybrid"
//         },
//         {
//             bookName: "The Alchemist",
//             authorName: "Paulo Coelho",
//             price: 9.99,
//             imageUrl: "https://img.freepik.com/premium-vector/open-book-illustration_671039-501.jpg"
//         },
//         {
//             bookName: "To Kill a Mockingbird",
//             authorName: "Harper Lee",
//             price: 12.49,
//             imageUrl: "https://img.freepik.com/premium-vector/book-icon-image_24911-30370.jpg"
//         }
//     ];

//     try {
//         const savedBooks = await HistoryBook.insertMany(books);
//         res.status(201).json({
//             message: "Books inserted successfully",
//             data: savedBooks
//         });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//         console.log("books add nhi huaa", error);

//     }
// }));


module.exports = router;
