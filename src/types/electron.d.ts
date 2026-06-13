export {}

declare global {
  interface Window {
    api: {
      getAppInfo: () => Promise<any>
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      invoke: (channel: string, ...args: any[]) => Promise<any>
      on: (channel: string, callback: (...args: any[]) => void) => () => void
      send: (channel: string, ...args: any[]) => void
    }
    electron: any
  }
}
