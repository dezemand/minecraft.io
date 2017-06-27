"use strict"
import * as ChunkDataLoader from 'prismarine-chunk/src/pc/1.9/chunk'
import * as BlockDataLoader from 'prismarine-block'
import {ChunkPosition, Position} from '../../Interfaces'
import {Vec3} from 'vec3'
import MinecraftBlock from './Block'

const Chunk = ChunkDataLoader('1.12')
const Block = BlockDataLoader('1.12')

export default class MinecraftChunk {
  private prismarineChunk

  constructor (public pos: ChunkPosition) {
    this.prismarineChunk = new Chunk()
    this.prismarineChunk.initialize((x, y, z) => {
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
    return this.prismarineChunk.dump()
  }

  public get id (): string {
    return this.pos.x + ',' + this.pos.z
  }

  private addSkyLight (): void {
    for (let x = 0; x < 16; x++)
      for (let z = 0; z < 16; z++)
        for (let y = 256; y > 0; y--) {
          this.prismarineChunk.setSkyLight(new Vec3(x, y, z), 15)
          if (this.prismarineChunk.getBlock(new Vec3(x, y, z))) break
        }
  }

  public getBlock (pos: Position): MinecraftBlock {
    const block = this.prismarineChunk.getBlock(new Vec3(pos.x, pos.y, pos.z))
    return block
  }
}
