"use strict"

export enum WorldType {
  Normal,
  Nether,
  End
}

export enum Event {
  ClientDisconnect,
  ClientInitiated,
  ClientSentCommand,
  ClientSentChat,
  ClientOnGround,
  ClientPosition,
  ClientLook,
  ClientChangeGamemode
}

export enum BlockDigStatus {
  Started,
  Cancelled,
  Finished,
  DropItemStack,
  DropItem,
  ShootArrow,
  ChangeHotbarSlot
}

export enum BlockFace {
  Bottom,
  Top,
  North,
  South,
  West,
  East,
  Special
}

export enum MouseButton {
  Left,
  Right,
  Middle
}

export enum HotbarButton {
  N1,
  N2,
  N3,
  N4,
  N5,
  N6,
  N7,
  N8,
  N9
}

export enum WindowClickMode {
  Normal,
  ShiftClick,
  HotbarKey,
  MiddleClick,
  DropItem,
  Dragging,
  DoubleClick
}
