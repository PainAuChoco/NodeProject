import { LevelDB } from './leveldb'
import WriteStream from 'level-ws'


export class MetricsHandler {
  private db: any 

  constructor(dbPath: string) {
    this.db = LevelDB.open(dbPath)
  }

  public getDb() {
    return this.db;
  }

  public save(key: string, username: string, metric: Metric, callback: (error: Error | null) => void) {
    const stream = WriteStream(this.db)
    stream.on('error', callback)
    stream.on('close', callback)
    stream.write({ key: `metric:${key}`, value: `${username}:${metric.timestamp}:${metric.value}`})
    stream.end()
    //callback(null)
  }

  public get(key: string, callback: (error: Error | null, result?: Metric[]) => void) {
    const result = this.db.get(key);
    callback(null, result)
  }

  public delete(key: string, callback: (error: Error | null, result: any) => void) {
    this.db.del(`metric:${key}`, function (err) {
      if (err) throw err
    })
  }

  public getOne(key: string, username: string,
    callback: (error: Error | null, result: any | null) => void) {
    let metrics: Metric[] = []
    this.db.createReadStream()
      .on('data', function (data: any) {
        let usr: string = data.value.split(':')[0]
        let timestamp: string = data.value.split(':')[1]
        let value: number = data.value.split(":")[2]
        let metric: Metric = new Metric(timestamp, value, data.key.split(":")[1])
        if ((key == data.key && username == usr) || username == "admin") {
          metrics.push(metric)
        }
      })
      .on('error', function (err: any) {
        console.log('Oh my!', err)
        callback(err, null)
      })
      .on('close', function () {
        console.log('Stream closed')
      })
      .on('end', function () {
        callback(null, metrics)
        console.log('Stream ended')
      })
  }


  public getAll(username: string,
    callback: (error: Error | null, result: any | null) => void) {
    let metrics: Metric[] = []
    this.db.createReadStream()
      .on('data', function (data: any) {
        let usr: string = data.value.split(':')[0]
        let timestamp: string = data.value.split(':')[1]
        let value: number = data.value.split(":")[2]
        let metric: Metric = new Metric(timestamp, value, data.key.split(":")[1])
        console.log(data.key)
        console.log(timestamp)
        if (usr == username || username == "admin") {
          metrics.push(metric) 
        }

      })
      .on('error', function (err: any) {
        console.log('Oh my!', err)
        callback(err, null)
      })
      .on('close', function () {
        console.log('Stream closed')
      })
      .on('end', function () {
        callback(null, metrics)
        console.log('Stream ended')
      })

  }
}

export class Metric {
  public timestamp: string
  public value: number
  public key: string

  constructor(ts: string, v: number, k: string) {
    this.timestamp = ts
    this.value = v
    this.key = k
  }
}