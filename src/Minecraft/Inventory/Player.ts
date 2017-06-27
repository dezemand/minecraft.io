"use strict"
import MinecraftClient from '../Client'
import MinecraftInventory from './Inventory'
import {Listener, SlotData, WindowClickData} from '../../Interfaces'
import MinecraftItemStack from '../Item/ItemStack'
import {WindowClickMode} from '../../Enums'

// TODO: Player inventory handling using rawClient's events
export default class MinecraftInventoryPlayer extends MinecraftInventory {
  static windowId: number = 0
  private mouseSlot: MinecraftItemStack

  constructor (private client: MinecraftClient) {
    super(client.loadInventory(), [0, 36])
  }

  public listen (): void {
    const listener: Listener = this.client.rawClient
    listener.on('window_click', (data: WindowClickData) => {
      switch (data.mode) {
        case WindowClickMode.Normal:
          // TODO: Do something based on MouseButton
          break
        // TODO: Other WindowClickModes
      }
    })
  }

  private getSlotData (slot: number): SlotData {
    if (slot === -1)
      return this.mouseSlot ? this.mouseSlot.data : MinecraftItemStack.emptyData
    return this.slots.has(slot) ? this.slots.get(slot).data : MinecraftItemStack.emptyData
  }

  private get dataArray (): Array<SlotData> {
    const array: Array<SlotData> = []
    for (let slot = this.slotRange[0]; slot < (this.slotRange[1] + 1); slot++)
      array[slot] = this.getSlotData(slot)
    return array
  }

  public sendFullInventory (): void {
    this.client.send('window_items', {
      windowId: MinecraftInventoryPlayer.windowId,
      items: this.dataArray
    })
  }

  public sendSlot (slot: number): void {
    this.client.send('set_slot', {
      windowId: MinecraftInventoryPlayer.windowId,
      slot,
      item: this.getSlotData(slot)
    })
  }
}
