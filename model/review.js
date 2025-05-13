const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true // Name of the student
    },
    room: {
        type: String,
        required: true // Room number
    },
    date: {
        type: Date,
        default: Date.now // Date of review
    },
    mealType: {
        type: String,
        enum: ['Lunch', 'Dinner'],
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true // 1 to 5 stars
    },
    reviewText: {
        type: String,
        maxlength: 500 // Optional feedback
    }
});

module.exports = mongoose.model('Review', reviewSchema);
