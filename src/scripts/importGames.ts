import {GamesStream, GamesStreamParams} from "../utils/GameStream";
import {config} from '../../config'
import {getMongoClient, getMostRecentGame, saveGame} from "../services/mongo";
import {LichessGameSummary, lichessGameSummarySchema} from "../models/lichessGame";
import {ZodError} from "zod";
import {InsertOneResult} from "mongodb";
import {BatchSaver} from "../utils/BatchSaver";

const inserts: Promise<InsertOneResult | Error>[] = []
async function main(): Promise<void> {
    const params: GamesStreamParams = {
        lichessApiKey: config.lichessApiKey,
        username: config.lichessUsername,
    };
    const mostRecentGame = await getMostRecentGame()
    if (mostRecentGame) {
        params['since'] = mostRecentGame.lastMoveAt
    }
    const gameStream = new GamesStream(params)
    const mongoClient = await getMongoClient()
    const batchSaver = new BatchSaver(mongoClient)
     batchSaver.on('saved', (data) => {
       console.log(`Saved ${data.insertedCount} games`)  
     })
    return new Promise((res, reject) => {
        gameStream.on('data', (data: string) => {
            let validatedGame: LichessGameSummary
            try {
                validatedGame = lichessGameSummarySchema.parse(JSON.parse(data))
                batchSaver.push(validatedGame)
            } catch (err) {
                console.warn(`ValidationFailure: ${(err as ZodError).message}`)
            }
        })
        gameStream.on('end', () => {
            console.log('Game stream ended')
            batchSaver.stop()
        })
        batchSaver.on('end', res)
    })
}

async function waitForInserts(): Promise<void>{
    await Promise.all(inserts).then(insertResults => {
        for (const insertResult of insertResults) {
              if(insertResult instanceof Error) {
                  console.warn(`Insert Failed: ${insertResult.message}`)
              } else {
                  console.log(`Insert result ok: ${insertResult.insertedId}`)
              }
        }
    })
}

main().then(() => {
    console.log('done')
}).catch((err) => {
    console.error(err)
})
