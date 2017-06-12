"use strict"
import MinecraftStore from './Store'
import MinecraftClient from '../Client'

interface Query {
  id?: string,
  uuid?: string,
  userName?: string
}

interface Position {
  x: number,
  y: number,
  z: number
}

export default class MinecraftStoreClient extends MinecraftStore {
  find(query: Query = {}): Array<MinecraftClient> {
    let results: Array<MinecraftClient> = []
    for(let client of this.stored.values()) {
      if(query.id !== undefined && query.id === client.id)
        results.push(client)
      if(query.uuid !== undefined && query.uuid === client.uuid)
        results.push(client)
      if(query.userName !== undefined && query.userName === client.userName)
        results.push(client)
    }
    return results
  }

  add(client: MinecraftClient): boolean {
    if(!super.add(client.id, client))
      return false
    client.on('disconnected', () => this.stored.delete(client.id))
    return true
  }

  others(client: MinecraftClient): (MinecraftClient) => void {
    return callback => {
      for(let otherClient of this.stored.values())
        if(client.uuid !== otherClient.uuid)
          callback(client)
    }
  }

  inRange(pos: Position, range: number, callback: (MinecraftClient) => void): void {
    this.all((cl: MinecraftClient) => {
      if((cl.pos.x - range) > pos.x) return
      if((cl.pos.x + range) < pos.x) return
      if((cl.pos.y - range) > pos.y) return
      if((cl.pos.y + range) < pos.y) return
      callback(cl)
    })
  }
}