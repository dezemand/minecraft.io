"use strict"
import MinecraftServer from './Server'
import MinecraftInventory from './Inventory/Inventory'
import MinecraftClient from './Client'

// TODO: Everything here...
export default class MinecraftFileSystem {
  constructor (private server: MinecraftServer) {
    this.createDataFolder()
  }

  private createDataFolder (): void {
  }

  public getPlayerInventory (client: MinecraftClient): MinecraftInventory {
    return new MinecraftInventory()
  }

}
