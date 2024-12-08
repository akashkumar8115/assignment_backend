const mongoose = require("mongoose");

const historyBookSchema = new mongoose.Schema({
    bookName: {
        type: String,
        required: [true, 'Book name is required']
    },
    authorName: {
        type: String,
        required: [true, 'Author name is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    imageUrl: {
        type: String,
        required: [true, 'Image URL is required'],
        validate: {
            validator: function (v) {
                return /^(http|https):\/\/[^ "]+$/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        },
        default: "https://www.svgrepo.com/show/94674/books-stack-of-three.svg"

    }
}, {
    timestamps: true,
    versionKey: false
});

const HistoryBook = mongoose.model("HistoryBook", historyBookSchema);

module.exports = HistoryBook;