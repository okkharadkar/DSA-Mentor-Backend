import { title } from 'process'
import { z } from 'zod'

export const signupInput = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6).regex(/^\S*$/, "Password cannot contain spaces")
})
export type SignupInput = z.infer<typeof signupInput>

export const signinInput = z.object({
    email: z.string().email(),
    password: z.string().min(6).regex(/^\S*$/, "Password cannot contain spaces")
})
export type SigninInput = z.infer<typeof signinInput>

export const problemStatementInput = z.object({
    title: z.string()
        .min(3)
        .max(200)
        .transform(val => val.trim().replace(/\s+/g, ' ').toLowerCase()),
    description: z.string().min(10).transform(val => val.trim()),
    constraints: z.array(z.string().transform(val => val.trim())).min(1)
})

export type ProblemStatementInput = z.infer<typeof problemStatementInput>

export const evaluatePSInput = z.object({
    title: z.string().min(3).max(200).transform(val => val.trim().replace(/\s+/g, ' ').toLowerCase()),
    approach: z.string(),
    code: z.string()
})
export type evaluatePSInput = z.infer<typeof evaluatePSInput>