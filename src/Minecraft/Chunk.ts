"use strict"
import * as ChunkDataLoader from 'prismarine-chunk/src/pc/1.9/chunk'
import * as BlockDataLoader from 'prismarine-block'
import {ChunkPosition} from '../Interfaces'
import {Vec3} from 'vec3'

const Chunk = ChunkDataLoader('1.12')
const Block = BlockDataLoader('1.12')

export default class MinecraftChunk {
  private chunk

  constructor (public pos: ChunkPosition) {
    this.chunk = new Chunk()
    this.chunk.initialize((x, y, z) => {
      if (y < 5)
        return new Block(7, 1, 0)
      if (y < 10)
        return new Block(11, 1, 0)
      if (y < 40)
        return new Block(1, 1, 0)
      if (y < 45)
        return new Block(3, 1, 0)
      if (y < 46)
        return new Block(2, 1, 0)
    })
    this.addSkyLight()
  }

  public get data (): Buffer {
    return this.chunk.dump()
  }

  public get id (): string {
    return this.pos.x + ',' + this.pos.z
  }

  private addSkyLight (): void {
    for (let x = 0; x < 16; x++)
      for (let z = 0; z < 16; z++)
        for (let y = 256; y > 0; y--) {
          this.chunk.setSkyLight(new Vec3(x, y, z), 15)
          if (this.chunk.getBlock(new Vec3(x, y, z))) break
        }
  }
}
