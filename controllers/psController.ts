import { Request, Response } from "express";
import { problemStatementInput, evaluatePSInput } from "../zodtypes/types";
import { any } from "zod";
import mongoose from "mongoose";

const { PS } = require('../models/ProblemStat');
const { User } = require('../models/User');
// import { GoogleGenAI } from "@google/genai";
const { GoogleGenAI } = require('@google/genai')
require('dotenv').config();

const genAI = new GoogleGenAI(process.env.GOOGLE_API_KEY as string)
// Define the type for problemsAttempted
interface ProblemAttempt {
    problemId: mongoose.Types.ObjectId;
    attempts: number;
    hintused: number;
    status: "attempted" | "solved";
    lastAttemptDate: Date;
}
const createPS = async (req: Request, res: Response) => {
    try {
        const bodydata = req.body;
        const userId = (req as any).id;

        // Validate and normalize input
        const validationResult = problemStatementInput.safeParse(bodydata);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid input",
                errors: validationResult.error.errors
            });
        }

        const normalizedData = validationResult.data;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if problem statement with same normalized title already exists
        const existingPS = await PS.findOne({
            title: normalizedData.title.toLowerCase()
        });

        if (existingPS) {
            return res.status(400).json({
                success: false,
                message: "Problem Statement with this title already exists!"
            });
        }

        // Create new problem statement with normalized data
        const ps = await PS.create({
            title: normalizedData.title,          // This will be stored lowercase
            // displayTitle: bodydata.title,         // This preserves original case
            description: normalizedData.description,
            constraints: normalizedData.constraints,
            attempts: 0,
            status: "pending",
            createdBy: userId
        });

        // Add problem to user's attempted problems
        const problemAttempt = {
            problemId: ps._id,
            attempts: 1,
            hintused: 0,
            status: "attempted",
            lastAttemptDate: new Date()
        };

        user.problemsAttempted.push(problemAttempt);

        // Update performance stats
        user.performanceStats.totalProblemsAttempted += 1;
        user.performanceStats.totalAttempts += 1;

        await user.save();

        res.status(201).json({
            success: true,
            message: "Problem Statement Submitted Successfully!",
            problemStatement: {
                ...ps.toObject(),
                title: ps.title // Send the display title in the response
            }
        });

    } catch (error: any) {
        console.error('Create Problem Statement error:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Problem Statement with this title already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to submit Problem Statement',
            error: error.message
        });
    }
}


const evaluatePS = async (req: Request, res: Response) => {
    try {
        const bodydata = req.body;
        const userId = (req as any).id;

        // Validate input
        const validationResult = evaluatePSInput.safeParse(bodydata);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid input",
                errors: validationResult.error.errors
            });
        }

        const { title, approach, code } = validationResult.data;

        // Fetch User
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Fetch Problem Statement
        const problem = await PS.findOne({ title: title.toLowerCase() });
        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem Statement not found" });
        }

        //  Update Problem Statement attempt count
        await PS.updateOne(
            { _id: problem._id },
            { $inc: { attempts: 1 } }
        );


        // Find if user already attempted this problem
        let userAttempt: ProblemAttempt | undefined = user.problemsAttempted.find(
            (pa: ProblemAttempt) => pa.problemId.toString() === problem._id.toString()
        );

        if (userAttempt) {
            userAttempt.attempts += 1;
            userAttempt.lastAttemptDate = new Date();
        } else {
            user.problemsAttempted.push({
                problemId: problem._id,
                attempts: 1,
                hintused: 0,
                status: "attempted",
                lastAttemptDate: new Date()
            });
        }

        // Update user performance stats
        user.performanceStats.totalAttempts += 1;
        user.performanceStats.totalProblemsAttempted = user.problemsAttempted.length;

        await user.save();

        // Check Unlock Conditions
        const totalAttempts = userAttempt ? userAttempt.attempts : 1;
        const hintUnlocked = totalAttempts >= 2;
        const solutionUnlocked = totalAttempts >= 4;

        // Prepare AI Prompt
        const prompt = `
        You are an expert programming assistant. 
        Evaluate the user's approach and code against the given problem statement.
        
        Problem Title: ${problem.title}
        Description: ${problem.description}
        Constraints: ${problem.constraints}
        
        User's Approach:
        ${approach}
        
        User's Code:
        ${code}

        Provide feedback on:
        1. Correctness
        2. Edge case handling
        3. Suggestions for improvement (not an optimal solution)

        Don't provide code to the user. Explain their mistake concisely and give hint that how he can solve this.
        `;

        // Call Gemini AI
        const response = await genAI.models.generateContent({
            model: "gemini-1.5-pro",
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        // Extract AI response
        const result = response.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";

        // Return Response
        res.status(200).json({
            success: true,
            message: "Evaluation complete",
            evaluation: result,
            attempts: totalAttempts,
            hintUnlocked,
            solutionUnlocked
        });

    } catch (error: any) {
        console.error("Evaluate Problem Statement error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to evaluate Problem Statement",
            error: error.message
        });
    }
};


const getAllPS = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const problems = await PS.find({ createdBy: userId })
        if (!problems) {
            return res.status(404).json({
                success: false,
                message: "Problem Statements not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Problem Statements Fetch Successfuly",
            evaluation: problems
        });



    } catch (error: any) {
        console.error('Evaluate Problem Statement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to evaluate Problem Statement',
            error: error.message
        });

    }
}

module.exports = { createPS, evaluatePS, getAllPS };

// module.exports = { createPS };
