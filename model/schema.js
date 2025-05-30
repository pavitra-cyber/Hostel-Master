const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    name: String,
    room: String,
    issue_type: String,  // cleaning, electrical, plumbing, food
    description: String,
    status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now },
    beforeImage: {
        data: Buffer,
        contentType: String
    },
    afterImage: {
        data: Buffer,
        contentType: String
    },
    userId: {  // Reference to the user (Login model)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'login',  // Reference to 'login' model
        required: true
    }
});

module.exports = mongoose.model('Issue', issueSchema);