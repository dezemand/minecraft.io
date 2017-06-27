"use strict"
import MinecraftItemStack from '../Item/ItemStack'

// TODO: Basic inventory handling
export default class MinecraftInventory {
  protected slots: Map<number, MinecraftItemStack> = new Map()

  constructor (inventory?: MinecraftInventory | Map<number, MinecraftItemStack>, readonly slotRange?: Array<number>) {
    if (inventory)
      this.fill(inventory)
  }

  public setSlot (slot: number, items: MinecraftItemStack): void {
    this.validateSlot(slot)
    this.slots.set(slot, items)
  }

  public getSlot (slot: number): MinecraftItemStack {
    return this.slots.get(slot)
  }

  public clear (slot: number): void {
    for (let [slot] of this.slots) {
      this.slots.set(slot, null)
    }
  }

  public get inventoryMap (): Map<number, MinecraftItemStack> {
    return new Map(this.slots)
  }

  public fill (inventory: MinecraftInventory | Map<number, MinecraftItemStack>): void {
    const slots = (inventory instanceof MinecraftInventory) ? inventory.inventoryMap : inventory
    for (let [slot, items] of slots)
      this.setSlot(slot, items)
  }

  protected validateSlot (slot: number): void {
    if (!this.slotRange)
      return
    if (slot < this.slotRange[0] || slot > this.slotRange[1])
      throw new Error(`Slot ${slot} does not exist in MinecraftInventoryPlayer`)
  }
}
