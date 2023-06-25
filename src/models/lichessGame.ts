import {z} from "zod";

let playerSchema = z.object({
    "user": z.object({
        "name": z.string(),
        "id": z.string()
    }).optional(),
    "rating": z.number().optional(),
    "ratingDiff": z.string().or(z.number()).optional()
});
export const lichessGameSummarySchema = z.object({
    "id": z.string(),
    "rated": z.boolean(),
    "variant": z.string(),
    "speed": z.string(),
    "perf": z.string(),
    "createdAt": z.number(),
    "lastMoveAt": z.number(),
    "status": z.string(),
    "players": z.object({
        "white": playerSchema.optional(),
        "black": playerSchema.optional()
    }),
    "winner": z.enum(["white", "black"]).optional(),
    "clock": z.object({
        "initial": z.number(),
        "increment": z.number(),
        "totalTime": z.number()
    }).optional()
})
export type LichessGameSummary = z.infer<typeof lichessGameSummarySchema>
