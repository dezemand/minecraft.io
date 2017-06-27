"use strict"
import * as MinecraftData from 'minecraft-data'
import MinecraftBiome from './Biome'
import {Position} from '../../Interfaces'
const mcData = MinecraftData('1.12')

export default class MinecraftBlock {
  public b: any

  constructor (public type: number, public biomeId: number, public metadata: number) {
    this.b = mcData[this.type]
    if (this.b.variations)
      for (let variation of this.b.variations)
        if (variation.metadata === metadata)
          this.displayName = variation.displayName
  }

  public biome: MinecraftBiome = new MinecraftBiome(this.biomeId)
  public position: Position = null
  public blockEnum: any = this.b
  public name: string = this.b ? this.b.name : ''
  public hardness: number = this.b ? this.b.hardness : 0
  public displayName: string = this.displayName || (this.b ? this.b.name : '')
  public boundingBox: string = this.b ? this.b.boundingBox : 'empty'
  public diggable: boolean = this.b ? this.b.diggable : false
  public material: string = this.b ? this.material : ''
  public harvestTools: any = this.b ? this.b.harvestTools : {}
  public drops: Array<any> = this.b ? this.b.drops : []
  public light: number = 0
  public skyLight: number = 0

  canHarvest (itemType: number): boolean {
    return !(this.harvestTools && (itemType === null || !this.harvestTools[itemType]))
  }

  digTime (itemType: number, creative: boolean = false, inWater: boolean = false, notOnGround: boolean = false): number {
    if (creative)
      return 0
    let time: number = 1000 * this.hardness * 1.5
    if (!this.canHarvest(itemType))
      return time * 10 / 3

    let toolMultiplier = mcData.toolMultipliers[this.material]
    if (toolMultiplier && itemType && toolMultiplier[itemType])
      time /= toolMultiplier[itemType]
    if (notOnGround)
      time *= 5
    if (inWater)
      time *= 5
    return time
  }
}
