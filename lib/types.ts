export interface MenuItemType {
  title: string
  icon: any
  path: string
  key: string
  description: string
}

export interface NotificationType {
  id: number
  title: string
  description: string
  time: string
  unread: boolean
}

export interface RouteConfig {
  path: string
  component: React.ComponentType
  title: string
  key: string
}