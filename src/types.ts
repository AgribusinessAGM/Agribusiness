export type CapexUnit = 'ha' | 'ud';

export interface CapexItem {
  key: string;
  label: string;
  v: number;
}

export interface CapexGroup {
  key: string;
  title: string;
  unit: CapexUnit;
  items: CapexItem[];
}

export interface OpexItem {
  key: string;
  label: string;
  unidad: string;
  cant: number;
  coste: number;
  base: number;
  sched: number[];
}

export interface OpexCategory {
  key: string;
  label: string;
  items: OpexItem[];
}

export interface Assumptions {
  superficie: number;
  marcoN: number;
  marcoM: number;
  precioEVOO: number;
  prodPlena: number;
  alquiler: number;
  personal: number;
  inflacion: number;
  is: number;
  financiacion: number;
  interes: number;
  plazo: number;
  carencia: number;
  capexFee: number;
  opexFee: number;
  fondoCost: number;
  equityFondo: number;
  capexGroups: CapexGroup[];
  opexItems: OpexCategory[];
}

export type CropType = 'olivo' | 'almendro';
export type ModelStatus = 'Activo' | 'Borrador' | 'En revisión';

export interface FinModel {
  id: number;
  name: string;
  crop: CropType;
  region: string;
  status: ModelStatus;
  updated: string;
  shared: string;
  a: Assumptions;
}

export type AccessLevel = 'edit' | 'view' | 'none';

export interface AppUser {
  name: string;
  email: string;
  org: string;
  access: Record<number, AccessLevel>;
}

export type Screen = 'login' | 'dashboard' | 'editor' | 'results' | 'admin';
export type EditorTab = 'supuestos' | 'capex' | 'opex' | 'rent' | 'fin';
export type TemplateKey = 'olivo' | 'almendro' | 'blank';

export interface Scenario {
  tirA: number | null;
  tirL: number | null;
  tirF: number | null;
  van: number;
  ebitda: number;
}
