// Import required modules
const express = require('express');
const app = express();
const Book = require('./src/database.js');
const mongoose = require('mongoose');
const methodOverride = require('method-override');

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static("public"));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/BOOK', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// View engine setup
app.set('view engine', 'ejs');

// Redirect to main page
app.get("/", function(req, res) {
    res.redirect("/main");
});

// Render main page
app.get("/main", async function(req, res) {
    try {
        res.render('main');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching books from the database');
    }
});

// Render add page
app.get("/add", function(req, res) {
    res.render('add');
});

// GET /catalog route with pagination, year validation, and sorting
app.get("/catalog", async function(req, res) {
    try {
        const { page = 1, limit = 10, year, sort } = req.query;

        // Convert page and limit to numbers
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        // Validate year range
        if (year && (isNaN(year) || year < 1500 || year > 2024)) {
            return res.status(400).send('Year should be a valid number between 1500 and 2024');
        }

        // Construct query based on year
        const query = year ? { year: parseInt(year) } : {};

        // Define sort options based on the selected attribute
        let sortOptions = {};
        if (sort === 'title') {
            sortOptions = { title: 1 }; // Sort by title in ascending order
        } else if (sort === 'author') {
            sortOptions = { author: 1 }; // Sort by author in ascending order
        }
        // You can add more sorting options based on your schema

        // Calculate skip value for pagination
        const skip = (pageNumber - 1) * limitNumber;

        // Fetch books with pagination, year filter, and sorting
        const books = await Book.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNumber)
            .exec();

        // Get total count of books based on the year filter
        const totalCount = await Book.countDocuments(query);

        // Calculate total pages
        const totalPages = Math.ceil(totalCount / limitNumber);

        // Prepare pagination metadata
        const pagination = {
            totalItems: totalCount,
            totalPages: totalPages,
            currentPage: pageNumber
        };

        res.render('catalog', { books, pagination });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching books from the database');
    }
});



// Add a new book
app.post("/add", async function(req, res) {
    try {
        const { title, author, genre, year } = req.body;

        if (isNaN(year) || year < 1500 || year > 2024) {
            return res.status(400).send('Year should be a valid number between 1500 and 2024');
        }

        const newBook = new Book({
            title: title,
            author: author,
            genre: genre,
            year: parseInt(year)
        });

        const savedBook = await newBook.save();
        
        console.log('Book added successfully:', savedBook);
        res.redirect("/main"); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving book to the database');
    }
});

// Render edit page
app.get("/edit", async function(req, res) {
    try {
        const books = await Book.find({}).exec();
        res.render('edit', { books });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching books for editing');
    }
});

// Update book information
app.put("/edit/:id", async function(req, res) {
    try {
        const bookId = req.params.id;
        const { title, author, genre, year } = req.body;

        if (isNaN(year) || year < 1500 || year > 2024) {
            return res.status(400).send('Year should be a valid number between 1500 and 2024');
        }

        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            {
                title: title,
                author: author,
                genre: genre,
                year: parseInt(year)
            },
            { new: true }
        ).exec();

        const books = await Book.find().exec();
        res.render('main', { books });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating book in the database');
    }
});

// Delete a book
app.delete("/edit/:id", async function(req, res) {
    try {
        const bookId = req.params.id;

        const deletedBook = await Book.findByIdAndDelete(bookId).exec();

        if (!deletedBook) {
            return res.status(404).send('Book not found');
        }

        const books = await Book.find().exec();
        res.render('main', { books });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting book from the database');
    }
});
// Retrieve a single book by its ID
app.get("/api/books/:id", async function(req, res) {
    try {
        const bookId = req.params.id;
        const book = await Book.findById(bookId).exec();
        if (!book) {
            return res.status(404).send('Book not found');
        }
        res.send(book);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching book from the database');
    }
});

// Update a book's information by its ID
app.put("/api/books/:id", async function(req, res) {
    try {
        const bookId = req.params.id;
        const { title, author, genre, year } = req.body;

        if (isNaN(year) || year < 1500 || year > 2024) {
            return res.status(400).send('Year should be a valid number between 1500 and 2024');
        }

        const updatedBook = await Book.findByIdAndUpdate(
            bookId,
            {
                title: title,
                author: author,
                genre: genre,
                year: parseInt(year)
            },
            { new: true }
        ).exec();

        res.send(updatedBook);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating book in the database');
    }
});

// Delete a book from the inventory by its ID
app.delete("/api/books/:id", async function(req, res) {
    try {
        const bookId = req.params.id;

        const deletedBook = await Book.findByIdAndDelete(bookId).exec();

        if (!deletedBook) {
            return res.status(404).send('Book not found');
        }

        res.send('Book deleted successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting book from the database');
    }
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
