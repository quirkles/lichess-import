import {InsertManyResult, InsertOneResult, MongoClient} from "mongodb";
import {LichessGameSummary} from "../models/lichessGame";
import {EventEmitter} from "events";
import {config} from "../../config";

export class BatchSaver extends EventEmitter{
    private readonly mongoClient: MongoClient
    private batchSize = 1000
    private acceptingDocuments = false

    private queue: LichessGameSummary[] =[]
    private batches: LichessGameSummary[][] = []
    private pending: Promise<InsertManyResult | Error> | null = null
    constructor(mongoClient: MongoClient) {
        super()
        this.mongoClient = mongoClient
        this.acceptingDocuments = true
        this.batchSave()
    }

    push(gameSummary: LichessGameSummary): void {
        this.queue.push(gameSummary)
        if(this.queue.length >= this.batchSize) {
            this.batches.push([...this.queue])
            this.queue = []
        }
    }

    private batchSave() {
        if(this.batches.length){
            const [batch, ...rest] = this.batches
            this.batches = rest
            this.pending = this.mongoClient.db(config.dbName).collection('games').insertMany(batch)

            this.pending.then((results) => {
                this.emit('saved', results)
            }).catch(err => {
                this.emit('saveError', err)
            }).then(() => {
                this.batchSave()
            })
        } else if(!this.acceptingDocuments){
            this.finish()
        } else {
            this.sleep(250).then(() => this.batchSave())
        }
    }
    private sleep(ms: number) {
        return new Promise((res) => {
            setTimeout(res, ms)
        })
    }

    private finish() {
        const batch = [...this.queue]
        this.queue = []
        this.pending = this.mongoClient.db(config.dbName).collection('games').insertMany(batch)

        this.pending.then((results) => {
            this.emit('saved', results)
        }).catch(err => {
            this.emit('saveError', err)
        }).then(() => {
            this.emit('end')
            this.pending = null
        })
    }

    stop() {
        this.acceptingDocuments = false
    }
}
