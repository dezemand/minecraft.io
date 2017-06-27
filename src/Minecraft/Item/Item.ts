"use strict"
import * as mcData from 'minecraft-data'

export default class MinecraftItem {
  readonly data
  readonly variation

  constructor (readonly id: number, readonly metadata: number = 0) {
    this.data = mcData('1.12').findItemOrBlockById(this.id)
    if (this.hasVariations)
      this.variation = this.getVariation(this.metadata)
  }

  public get hasVariations (): boolean {
    return this.data.variations !== undefined
  }

  public getVariation (metadata: number): any {
    try {
      return this.data.variations.filter(val => val.metadata === metadata)[0]
    } catch (e) {
      return null
    }
  }

  public equals (item: MinecraftItem): boolean {
    return this.id === item.id && this.metadata === item.metadata
  }
}
