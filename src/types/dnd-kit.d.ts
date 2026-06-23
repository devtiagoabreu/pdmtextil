declare module "@dnd-kit/core" {
  import React from "react"

  export const KeyboardCode: Record<string, string>
  export enum AutoScrollActivator { Always = "Always", Draggable = "Draggable" }
  export enum TraversalOrder { Tree = "Tree", BreadthFirst = "BreadthFirst" }
  export enum MeasuringStrategy { Always = "Always", BeforeDragging = "BeforeDragging", WhileDragging = "WhileDragging" }
  export enum MeasuringFrequency { Optimized = "Optimized" }

  export interface DndContextProps {
    id?: string
    accessibility?: {
      announcements?: any
      container?: Element
      restoreFocus?: boolean
      screenReaderInstructions?: any
    }
    autoScroll?: boolean | any
    cancelDrop?: any
    children?: React.ReactNode
    collisionDetection?: any
    measuring?: any
    modifiers?: any
    sensors?: any[]
    onDragAbort?(event: any): void
    onDragPending?(event: any): void
    onDragStart?(event: any): void
    onDragMove?(event: any): void
    onDragOver?(event: any): void
    onDragEnd?(event: any): void
    onDragCancel?(event: any): void
  }
  export const DndContext: React.NamedExoticComponent<DndContextProps>

  export interface DragOverlayProps {
    adjustScale?: boolean
    children?: React.ReactNode
    className?: string
    style?: React.CSSProperties
    transition?: string
    dropAnimation?: any | null
    modifiers?: any
    wrapperElement?: keyof JSX.IntrinsicElements
    zIndex?: number
  }
  export const DragOverlay: React.MemoExoticComponent<(props: DragOverlayProps) => JSX.Element>

  export function useDraggable(options: {
    id: string
    data?: any
    disabled?: boolean
    attributes?: any
  }): {
    attributes: Record<string, any>
    isDragging: boolean
    listeners: Record<string, any>
    setNodeRef: (node: HTMLElement | null) => void
    transform: any | null
    active: any
    over: any
    node: HTMLElement | null
  }

  export function useDroppable(options: {
    id: string
    data?: any
    disabled?: boolean
  }): {
    isOver: boolean
    setNodeRef: (node: HTMLElement | null) => void
    over: any
    active: any
    node: HTMLElement | null
  }

  export function useDndContext(): any

  export function useDndMonitor(listener: any): void

  export function useSensor(sensor: any, options?: any): any

  export function useSensors(...sensors: any[]): any[]

  export class PointerSensor {
    static activators: any[]
    constructor(props: any, doc: Document)
  }

  export class MouseSensor {
    static activators: any[]
    constructor(props: any, doc: Document)
  }

  export class TouchSensor {
    static activators: any[]
    constructor(props: any, doc: Document)
  }

  export class KeyboardSensor {
    static activators: any[]
    constructor(props: any, keyboardEvents: any, doc: Document)
  }

  export const KeyboardCode: Record<string, string>

  export function closestCenter(event: any): any
  export function closestCorners(event: any): any
  export function pointerWithin(event: any): any
  export function rectIntersection(event: any): any

  export function getClientRect(element: Element): any
  export function getFirstCollision(collisions: any[] | null): any
  export function getScrollableAncestors(element: Element): Element[]

  export const defaultAnnouncements: any
  export const defaultCoordinates: any
  export const defaultDropAnimation: any
  export const defaultDropAnimationSideEffects: any
  export const defaultKeyboardCoordinateGetter: any
  export const defaultScreenReaderInstructions: any
}
