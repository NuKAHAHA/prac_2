const { connect } = require('http2');
const mongoose = require('mongoose');

const db = mongoose.connect('mongodb://localhost:27017/BOOK')


// Проверка на подключение бд

db.then(() =>{
    console.log('Connect is successful');
})
.catch(() =>{
    console.log('Connect is not successful')
})

// create schema pon da
const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    genre: String,
    year: Number
})

// Collection 
const bookCollection = new mongoose.model("book.list", bookSchema);

module.exports = bookCollection;