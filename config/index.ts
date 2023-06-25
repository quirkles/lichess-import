export interface Config {
    lichessApiKey: string,
    lichessUsername: string,
    dbName: string,
    mongoConnectionString: string
}

export * from "./config"
