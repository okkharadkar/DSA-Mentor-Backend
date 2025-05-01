import mongoose, { model, mongo } from "mongoose";

const ProblemStat = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        set: (val: string) => val.trim().replace(/\s+/g, ' ').toLowerCase()
    },
    // displayTitle: {
    //     type: String,
    //     required: true,
    //     set: (val: string) => val.trim().replace(/\s+/g, ' ')
    // },
    description: {
        type: String,
        required: true,
        set: (val: string) => val.trim()
    },
    constraints: { 
        type: [String], 
        required: true,
        set: (val: string[]) => val.map(str => str.trim())
    },
    attempts: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
})

export const PS = mongoose.model('PS', ProblemStat)
module.exports = { PS }