import {Readable} from 'stream'
import axios from 'axios'
import {getQueryParamString} from "./getQueryParamString";

export interface GamesStreamParams {
    lichessApiKey: string;
    username: string,
    since?: number
}

export class GamesStream extends Readable {
    private stream: Readable | null = new Readable({
        read() {
            this.push('Stream pending')
        }
    })
    private error: Error | null = null

    constructor(
        params: GamesStreamParams,
    ) {
        super();
        const {username, lichessApiKey, ...rest} = params
        let url = `https://lichess.org/api/games/user/${username}${getQueryParamString({...rest, ongoing: false, sort: 'dateAsc'})}`;
        axios.get<Readable>(url, {
            headers: {
                Authorization: `Bearer ${lichessApiKey}`,
                Accept: 'application/x-ndjson',
            },
            responseType: "stream"
        })
            .then(resp => resp.data)
            .catch(err => {
                this.error = new Error(`Failed to get game stream: ${err.message}`)
                return null
            })
            .then(resp => {
                this.stream = resp
                return this.startReading()
            })
            .then(() => {
                this.stream?.read()
            })
    }

    private async startReading(): Promise<void> {
        if (!this.stream) {
            throw new Error('Stream not initialized')
        }
        const matcher = /\r?\n/;
        const decoder = new TextDecoder();
        this.stream.on('data', (data) => {
            const chunk = decoder.decode(data, {stream: true});
            const parts = chunk.toString().split(matcher);
            parts.filter(p => p && p.length).map(part => {
                this.push(part)
            })
        });
        this.stream.on('end', () => {
            this.stream = null;
            this.push(null)
        })
        if (this.error) {
            throw this.error
        }
    }

    _read(size: number) {
        if (!this.stream) {
            throw new Error('Stream not initialized')
        }
        this.stream.read()
    }
}
