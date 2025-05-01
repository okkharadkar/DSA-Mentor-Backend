
import dotenv from 'dotenv'
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

import { Request, Response } from 'express';

if (!process.env.JWT_SECRET) {
    console.warn("Warning: JWT_SECRET is not set in .env file. Using a default value.");
}
// import {PS} from '../models/ProblemStat'
const { PS } = require('../models/ProblemStat')
const { User } = require('../models/User')
// import { User  } from "../models/User";

const jwt = require('jsonwebtoken')
import { signinInput, signupInput } from "../zodtypes/types";

const generateToken = (id: String, email: String) => {
    return jwt.sign({ id, email }, JWT_SECRET, {
        expiresIn: '30d'
    });
}

const signup = async (req: Request, res: Response) => {
    try {
        // step1-check zod validation
        const bodydata = req.body;
        const inputval = signupInput.safeParse(bodydata);
        if (!inputval.success) {
            res.status(411).json({
                msg: "Invalid Inputs"
            })
        }
        // step2-check existing user
        const exitstingUser = await User.findOne({ email: bodydata.email })
        if (exitstingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            })
        }
        // step3-create user
        const user = await User.create({
            name: bodydata.name,
            email: bodydata.email,
            password: bodydata.password,
            problemsAttempted: [

            ],
            performanceStats: {
                totalProblemsAttempted: 0,
                totalSolved: 0,
                totalAttempts: 0,
                hintsUsedCount: 0,
                mostFrequentTopic: '',
                learningScore: 0
            }
        })
        if (user) {
            res.status(201).json({
                success: true,
                message: "Signup Successfully..!",
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                },
                token: generateToken(user._id, user.email)
            })
        }

    } catch (error: any) {
        // ✅ Handle MongoDB Duplicate Key Error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        // ✅ Handle Validation Errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return res.status(400).json({
                success: false,
                message: messages[0],
            });
        }

        // ✅ Handle Missing JWT_SECRET
        if (!JWT_SECRET) {
            console.error("Error: JWT_SECRET is missing in environment variables.");
            return res.status(500).json({
                success: false,
                message: "Server misconfiguration: JWT_SECRET is missing.",
            });
        }

        // ✅ Return actual error message for debugging
        return res.status(500).json({
            success: false,
            message: error.message || "Unable to create account. Please try again later.",
        });
    }
}

const signin = async (req: Request, res: Response) => {
    try {
        // step1-check input validation
        const bodydata = req.body;
        const inputval = signinInput.safeParse(bodydata);
        if (!inputval.success) {
            return res.status(411).json({
                msg: "Invalid Inputs"
            })
        }
        // step2-check user exist or not
        const user = await User.findOne({ email: bodydata.email })
        if (!user) {
            return res.status(401).json({
                success: false,
                msg: "Invalid email or password"

            });
        }
        //check password 
        if (user.password !== bodydata.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            })
        }
        res.json({
            success: true,
            message: "Login Successfully...!",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
            token: generateToken(user._id, user.email)
        })


    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Error during login. Please try again."
        });

    }

}

const profile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).id;
        // console.log(userId);
        const user = await User.findById(userId).select('-password')
        // console.log(user)
        // console.log(decode)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                problemsAttempted: user.problemsAttempted,
                performanceStats: {
                    totalProblemsAttempted: user.performanceStats.totalProblemsAttempted,
                    totalSolved: user.performanceStats.totalSolved,
                    totalAttempts: user.performanceStats.totalAttempts,
                    hintsUsedCount: user.performanceStats.hintsUsedCount,
                    learningScore: user.performanceStats.learningScore
                }

            },
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching profile"
        });

    }
}

module.exports = { signup, signin, profile }