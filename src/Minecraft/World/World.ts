"use strict"
import {Position, WorldOptions} from '../../Interfaces'
import MinecraftWorldStore from '../Store/World'
import {WorldType} from '../../Enums'
import MinecraftServer from '../Server'
import MinecraftClient from '../Client'
import MinecraftEntity from '../Entity/Entity'
import Debug from '../../Debug'
import MinecraftChunk from './Chunk'

const debug = new Debug('MinecraftWorld')

// TODO: Loading from MinecraftFileSystem, instead of using TEMPCreateChunks
export default class MinecraftWorld {
  public id: number
  public type: WorldType
  private store: MinecraftWorldStore
  private server: MinecraftServer
  public name: string
  private chunks: Map<string, MinecraftChunk> = new Map()

  constructor (options: WorldOptions) {
    this.type = options.type
    this.server = options.server
    this.name = options.name
    debug.log(`New world created '${this.name}' with type ${this.type}`)
    this.TEMPCreateChunks()
  }

  private TEMPCreateChunks () {
    for (let z = -3; z < 3; z++) {
      for (let x = -3; x < 3; x++) {
        const chunk: MinecraftChunk = new MinecraftChunk({x, z})
        this.chunks.set(chunk.id, chunk)
      }
    }
  }

  public setStore (store: MinecraftWorldStore, id: number): void {
    this.id = id
    this.store = store
  }

  public getClients (): Set<MinecraftClient> {
    return this.server.clients.find({world: this})
  }

  public getEntities (): Set<MinecraftEntity> {
    return this.server.entities.find({world: this})
  }

  public getChunk (x: number, z: number): MinecraftChunk {
    const id: string = x + ',' + z
    if (!this.chunks.has(id))
      throw new Error('Cannot access chunk, not stored')
    return this.chunks.get(id)
  }

  public getChunkByPosition (pos: Position): MinecraftChunk {
    const x: number = Math.floor(pos.x / 16 / 32)
    const z: number = Math.floor(pos.z / 16 / 32)
    return this.getChunk(x, z)
  }
}
