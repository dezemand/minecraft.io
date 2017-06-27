"use strict"
import MinecraftClient from '../Client'
import MinecraftInventory from './Inventory'
import {Listener, SetCreativeSlotData, WindowClickData} from '../../Interfaces'
import MinecraftItemStack from '../Item/ItemStack'
import {MouseButton, WindowClickMode} from '../../Enums'
import Debug from '../../Debug'

const debug = new Debug('MinecraftInventoryPlayer')

export default class MinecraftInventoryPlayer extends MinecraftInventory {
  static windowId: number = 0

  constructor (private client: MinecraftClient) {
    super(client.loadInventory(), [0, 36])
  }

  public listen (): void {
    const listener: Listener = this.client.rawClient
    listener.on('window_click', (data: WindowClickData) => {
      if (data.windowId !== MinecraftInventoryPlayer.windowId) return
      debug.log(`Client clicked in window, click mode: ${WindowClickMode[data.mode]}`)
      switch (data.mode) {
        case WindowClickMode.Normal:
          if (data.mouseButton === MouseButton.Left)
            this.leftClick(data.slot)
          if (data.mouseButton === MouseButton.Right)
            this.rightClick(data.slot)
          break
        case WindowClickMode.ShiftClick:
          this.shiftClick(data.slot)
          break
        case WindowClickMode.HotbarKey:
          this.hotbarSwitch(data.slot, data.mouseButton)
          break
        case WindowClickMode.MiddleClick:
          // TODO: Creative middle click (Not in inventory?)
          break
        case WindowClickMode.DropItem:
          // TODO: Drop items from inventory
          break
        case WindowClickMode.Dragging:
          // TODO: Drag items in inventory
          break
        case WindowClickMode.DoubleClick:
          // TODO: Double clicking in inventory
          break
        default:
          debug.log(`Click mode ${data.mode} is not supported...`)
      }
    })
    listener.on('set_creative_slot', (data: SetCreativeSlotData) => {
      if (this.client.gameMode !== 1)
        return this.client.kick({text: 'Illegal action'})
      this.setSlot(data.slot, MinecraftItemStack.fromData(data.item))
    })
  }

  public sendFullInventory (): void {
    this.client.send('window_items', {
      windowId: MinecraftInventoryPlayer.windowId,
      items: this.dataArray
    })
  }

  public sendSlot (slot: number): void {
    debug.log(`Sending slot ${slot} to client`)
    this.client.send('set_slot', {
      windowId: MinecraftInventoryPlayer.windowId,
      slot,
      item: this.getSlotData(slot)
    })
  }

  public sendSlots (slots: Array<number>): void {
    for (let slot of slots)
      this.sendSlot(slot)
  }

  public updateSlot (slot: number, item: MinecraftItemStack): void {
    this.setSlot(slot, item)
    this.sendSlot(slot)
  }

  public leftClick (slot: number): void {
    if (this.isSlotEmpty(-1) || this.isSlotEmpty(slot))
      this.switchSlots(-1, slot)
    else if (this.getSlot(slot).canCombineStacks(this.getSlot(-1))) {
      this.updateSlot(slot, this.getSlot(slot).changeAmount(this.getSlot(-1).amount, true))
      this.clear(-1)
    } else if (this.getSlot(slot).itemEquals(this.getSlot(-1))) {
      const canAdd = this.getSlot(slot).stackSize - this.getSlot(slot).amount
      this.updateSlot(slot, this.getSlot(slot).changeAmount(canAdd, true))
      this.updateSlot(-1, this.getSlot(-1).changeAmount(-canAdd, true))
    } else
      this.switchSlots(-1, slot)
  }

  public rightClick (slot: number): void {
    const itemSlot = this.getSlot(slot)
    const itemMouse = this.getSlot(-1)

    if (!this.isSlotEmpty(-1) && !this.isSlotEmpty(slot) && itemSlot.canCombineStacks(itemMouse.changeAmount(1))) {
      this.updateSlot(slot, itemSlot.changeAmount(1, true))
      this.updateSlot(-1, itemMouse.changeAmount(-1, true))
    } else if (this.isSlotEmpty(-1) && !this.isSlotEmpty(slot)) {
      this.updateSlot(-1, itemSlot.changeAmount(Math.ceil(itemSlot.amount / 2)))
      this.updateSlot(slot, itemSlot.changeAmount(Math.floor(itemSlot.amount / 2)))
    } else if (this.isSlotEmpty(slot) && !this.isSlotEmpty(-1)) {
      this.updateSlot(slot, itemMouse.changeAmount(1))
      this.updateSlot(-1, itemMouse.changeAmount(-1, true))
    }
  }

  // TODO: Add the shift left click feature
  public shiftClick (slot: number): void {
    // Disable until added...
    setTimeout(() => this.sendFullInventory(), 5)
  }

  public hotbarSwitch (slot: number, hotbarOffset: number) {
    this.switchSlots(slot, 36 + hotbarOffset)
    this.sendSlots([slot, 36 + hotbarOffset])
  }
}
