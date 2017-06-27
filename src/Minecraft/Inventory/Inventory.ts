"use strict"
import MinecraftItemStack from '../Item/ItemStack'
import {SlotData} from '../../Interfaces'
import Debug from '../../Debug'

const debug = new Debug('MinecraftInventory')

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

  public isSlotEmpty (slot: number): boolean {
    if (!this.slots.has(slot)) return true
    if (!(this.slots.get(slot) instanceof MinecraftItemStack)) return true
    return this.slots.get(slot).amount < 1
  }

  public clear (slot?: number): void {
    if (slot !== undefined)
      return this.setSlot(slot, null)
    else
      for (let [slot] of this.slots)
        this.clear(slot)
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
    // if (!this.slotRange)
    //   return
    // if (slot < this.slotRange[0] || slot > this.slotRange[1])
    //   throw new Error(`Slot ${slot} does not exist in MinecraftInventoryPlayer`)
  }

  protected getSlotData (slot: number): SlotData {
    return this.slots.has(slot) && (this.slots.get(slot)) ?
      this.slots.get(slot).data :
      MinecraftItemStack.emptyData
  }

  protected get dataArray (): Array<SlotData> {
    const array: Array<SlotData> = []
    if (this.slotRange)
      for (let slot = this.slotRange[0]; slot < (this.slotRange[1] + 1); slot++)
        array[slot] = this.getSlotData(slot)
    else {
      for (let [slot] of this.slots)
        if (slot >= 0)
          array[slot] = this.getSlotData(slot)
      for (let [index, value] of array.entries())
        if (value === undefined)
          array[index] = MinecraftItemStack.emptyData
    }
    return array
  }

  public switchSlots (slot1: number, slot2: number): void {
    if (slot1 === slot2) return
    debug.log(`Switching slots ${slot1} and ${slot2}`)
    const item1: MinecraftItemStack = this.getSlot(slot1)
    const item2: MinecraftItemStack = this.getSlot(slot2)
    this.setSlot(slot1, item2)
    this.setSlot(slot2, item1)
  }
}
