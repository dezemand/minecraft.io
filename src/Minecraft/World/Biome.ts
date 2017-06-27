"use strict"
import * as MinecraftData from 'minecraft-data'
const mcData = MinecraftData('1.12')

export default class MinecraftBiome {
  constructor (public id) {
  }

  public biomeEnum: any = mcData.biomes[this.id]
  public b: any = this.biomeEnum
  public color: number = this.b ? this.b.color : 0
  public name: string = this.b ? this.b.string : ''
  public height: number = this.b ? this.b.height : null
  public rainfall: number = this.b ? this.b.rainfall : 0
  public temperature: number = this.b ? this.b.temperature : 0
}
