// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
