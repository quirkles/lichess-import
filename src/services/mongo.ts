import {InsertOneResult, MongoClient} from 'mongodb'
import {config} from "../../config";
import {LichessGameSummary, lichessGameSummarySchema} from "../models/lichessGame";

export async function getMostRecentGame(): Promise<LichessGameSummary | null> {
    const client = await getMongoClient()
    return client.db(config.dbName)
        .collection('games')
        .find()
        .limit(1)
        .sort('createdAt', 'desc')
        .next()
        .then((result) => {
            if (result === null) {
                return null
            }
            return lichessGameSummarySchema.parse(result)
        })
}

export async function saveGame(game: LichessGameSummary): Promise<InsertOneResult | Error> {
    const client = await getMongoClient()
    return client
        .db(config.dbName)
        .collection('games')
        .insertOne(game)
        .catch(err => err)
}

let client: MongoClient | null = null

export async function getMongoClient(): Promise<MongoClient> {
    if (!client) {
        client = new MongoClient(config.mongoConnectionString)
        await client.connect()
    }
    return client

}
