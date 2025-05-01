import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is Required.']
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required.'],
        minlength: 6
    },
    problemsAttempted: [{
        problemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProblemStat',
        },
        attempts: {
            type: Number,
            default: 0,
            required: true
        },
        hintused: {
            type: Number,
            default: 0,
            required: true
        },
        status: {
            type: String,
            enum: ['attempted', 'solved', 'in-progress'],
            default: 'attempted'
        },
        lastAttemptDate: {
            type: Date,
            default: Date.now
        }
    }],
    performanceStats: {
        totalProblemsAttempted: Number,
        totalSolved: Number,
        totalAttempts: Number,
        hintsUsedCount: Number,
        mostFrequentTopic: String,
        learningScore: Number
    }

});
export const User = mongoose.model('User', userSchema);
module.exports = { User }
