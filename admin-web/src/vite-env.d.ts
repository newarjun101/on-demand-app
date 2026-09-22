/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_API_URL: string; }
interface ImportMeta { readonly env: ImportMetaEnv; }
declare module '*.json' { const v: any; export default v; }
declare module '*.svg' { const v: string; export default v; }
