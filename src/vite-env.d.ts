/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_MAP_KEY: string
}

/* Kakao Maps SDK – minimal type stubs */
declare global {
  interface Window {
    kakao?: {
      maps: {
        load(cb: () => void): void
        Map: new (
          el: HTMLElement,
          opts: { center: unknown; level: number }
        ) => { setCenter(ll: unknown): void }
        LatLng: new (lat: number, lng: number) => unknown
        Marker: new (opts: { map: unknown; position: unknown }) => unknown
        services: {
          Places: new () => {
            keywordSearch(
              keyword: string,
              cb: (
                data: { x: string; y: string; place_name: string }[],
                status: string
              ) => void
            ): void
          }
          Status: { OK: string }
        }
      }
    }
  }
}

export {}
