"use strict"
import MinecraftClient from '../Client'
import MinecraftWorld from './World'
import {BlockDigData, Listener} from '../../Interfaces'
import MinecraftChunk from './Chunk'
import MinecraftBlock from './Block'

export default class MinecraftWorldInteractor {
  constructor (private client: MinecraftClient) {
  }

  public listen (): void {
    const emitter: Listener = this.client.rawClient
    emitter.on('block_dig', this.digAction.bind(this))
  }

  public digAction (data: BlockDigData): void {
    const chunk: MinecraftChunk = this.client.world.getChunkByPosition(data.location)
    const block: MinecraftBlock = chunk.getBlock(data.location)
    if (!block.canHarvest(0)) {
    }
    const digTime = block.digTime(0, this.client.gameMode === 1, false, !this.client.onGround)
  }

  public get world (): MinecraftWorld {
    return this.client.world
  }
}
