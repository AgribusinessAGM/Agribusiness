import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  AccessLevel,
  Assumptions,
  EditorTab,
  FinModel,
  Scenario,
  Screen,
  TemplateKey,
} from '../types';
import { baseA, buildSeed, buildUsers } from '../data/seed';
import { fmt2, parseNum } from '../engine/format';

export interface AppState {
  screen: Screen;
  activeId: number;
  etab: EditorTab;
  models: FinModel[];
  users: ReturnType<typeof buildUsers>;
  showNew: boolean;
  newName: string;
  newHa: number;
  newTemplate: TemplateKey;
  scenario: Scenario | null;
  toast: string | null;
  projHa: number;
  editKey: string | null;
  editRaw: string;
}

function initialState(): AppState {
  return {
    screen: 'login',
    activeId: 1,
    etab: 'supuestos',
    models: buildSeed(),
    users: buildUsers(),
    showNew: false,
    newName: '',
    newHa: 100,
    newTemplate: 'olivo',
    scenario: null,
    toast: null,
    projHa: 1,
    editKey: null,
    editRaw: '',
  };
}

export interface AppStore {
  state: AppState;
  active: () => FinModel;
  edVal: (id: string, val: number) => string;
  login: () => void;
  logout: () => void;
  gotoDash: () => void;
  gotoAdmin: () => void;
  gotoResults: () => void;
  gotoEditor: () => void;
  openModel: (id: number) => void;
  openResults: (id: number) => void;
  setEtab: (key: EditorTab) => void;
  onNumFocus: (id: string, currentDisplay: string) => void;
  onNumBlur: () => void;
  onField: (key: keyof Assumptions, raw: string) => void;
  onCapexField: (gkey: string, ikey: string, raw: string) => void;
  onOpexField: (catkey: string, itkey: string, field: 'cant' | 'coste', raw: string) => void;
  onProjHaField: (raw: string) => void;
  cyclePerm: (userIndex: number, modelId: number) => void;
  invite: () => void;
  save: () => void;
  exportXlsx: () => void;
  exportPdf: () => void;
  openNew: () => void;
  closeNew: () => void;
  setNewName: (v: string) => void;
  setNewHa: (v: number) => void;
  setNewTemplate: (v: TemplateKey) => void;
  createModel: () => void;
  saveScenario: (s: Scenario) => void;
  clearScenario: () => void;
  flash: (msg: string) => void;
}

function inpId(ds: { opfld?: string; catkey?: string; itkey?: string; gkey?: string; ikey?: string; key?: string }): string {
  if (ds.opfld) return 'op:' + ds.opfld + ':' + ds.catkey + '.' + ds.itkey;
  if (ds.gkey) return 'cap:' + ds.gkey + '.' + ds.ikey;
  return 'sup:' + ds.key;
}

export function useAppStore(): AppStore {
  const [state, setState] = useState<AppState>(initialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const active = useCallback(
    () => state.models.find((m) => m.id === state.activeId) || state.models[0],
    [state.models, state.activeId],
  );

  const edVal = useCallback(
    (id: string, val: number) => (state.editKey === id ? state.editRaw : fmt2(val)),
    [state.editKey, state.editRaw],
  );

  const flash = useCallback((msg: string) => {
    setState((s) => ({ ...s, toast: msg }));
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setState((s) => ({ ...s, toast: null })), 2200);
  }, []);

  const login = useCallback(() => setState((s) => ({ ...s, screen: 'dashboard' })), []);
  const logout = useCallback(() => setState((s) => ({ ...s, screen: 'login' })), []);
  const gotoDash = useCallback(() => setState((s) => ({ ...s, screen: 'dashboard' })), []);
  const gotoAdmin = useCallback(() => setState((s) => ({ ...s, screen: 'admin' })), []);
  const gotoResults = useCallback(() => setState((s) => ({ ...s, screen: 'results' })), []);
  const gotoEditor = useCallback(() => setState((s) => ({ ...s, screen: 'editor' })), []);

  const openModel = useCallback(
    (id: number) => setState((s) => ({ ...s, activeId: id, screen: 'editor', etab: 'supuestos' })),
    [],
  );
  const openResults = useCallback(
    (id: number) => setState((s) => ({ ...s, activeId: id, screen: 'results' })),
    [],
  );
  const setEtab = useCallback((key: EditorTab) => setState((s) => ({ ...s, etab: key })), []);

  const onNumFocus = useCallback((id: string, currentDisplay: string) => {
    setState((s) => ({ ...s, editKey: id, editRaw: String(currentDisplay).replace(/\./g, '') }));
  }, []);
  const onNumBlur = useCallback(() => {
    setState((s) => ({ ...s, editKey: null, editRaw: '' }));
  }, []);

  const onField = useCallback((key: keyof Assumptions, raw: string) => {
    const v = parseNum(raw);
    setState((s) => ({
      ...s,
      editKey: inpId({ key }),
      editRaw: raw,
      models: s.models.map((m) =>
        m.id === s.activeId ? { ...m, a: { ...m.a, [key]: v } } : m,
      ),
    }));
  }, []);

  const onCapexField = useCallback((gkey: string, ikey: string, raw: string) => {
    const v = parseNum(raw);
    setState((s) => ({
      ...s,
      editKey: inpId({ gkey, ikey }),
      editRaw: raw,
      models: s.models.map((m) => {
        if (m.id !== s.activeId) return m;
        const groups = m.a.capexGroups.map((g) =>
          g.key !== gkey
            ? g
            : { ...g, items: g.items.map((it) => (it.key === ikey ? { ...it, v } : it)) },
        );
        return { ...m, a: { ...m.a, capexGroups: groups } };
      }),
    }));
  }, []);

  const onOpexField = useCallback(
    (catkey: string, itkey: string, field: 'cant' | 'coste', raw: string) => {
      const v = parseNum(raw);
      setState((s) => ({
        ...s,
        editKey: inpId({ opfld: field, catkey, itkey }),
        editRaw: raw,
        models: s.models.map((m) => {
          if (m.id !== s.activeId) return m;
          const cats = m.a.opexItems.map((c) =>
            c.key !== catkey
              ? c
              : { ...c, items: c.items.map((it) => (it.key === itkey ? { ...it, [field]: v } : it)) },
          );
          return { ...m, a: { ...m.a, opexItems: cats } };
        }),
      }));
    },
    [],
  );

  const onProjHaField = useCallback((raw: string) => {
    const v = parseNum(raw);
    setState((s) => ({ ...s, editKey: 'ui:projHa', editRaw: raw, projHa: v }));
  }, []);

  const cyclePerm = useCallback((userIndex: number, modelId: number) => {
    const order: Record<AccessLevel, AccessLevel> = { none: 'view', view: 'edit', edit: 'none' };
    setState((s) => ({
      ...s,
      users: s.users.map((u, i) =>
        i === userIndex ? { ...u, access: { ...u.access, [modelId]: order[u.access[modelId]] } } : u,
      ),
    }));
  }, []);

  const invite = useCallback(() => flash('Invitación enviada (demo)'), [flash]);
  const save = useCallback(() => flash('Modelo guardado'), [flash]);
  const exportXlsx = useCallback(() => flash('Exportando a Excel…'), [flash]);
  const exportPdf = useCallback(() => flash('Generando informe PDF…'), [flash]);

  const openNew = useCallback(
    () => setState((s) => ({ ...s, showNew: true, newName: '', newHa: 100, newTemplate: 'olivo' })),
    [],
  );
  const closeNew = useCallback(() => setState((s) => ({ ...s, showNew: false })), []);
  const setNewName = useCallback((v: string) => setState((s) => ({ ...s, newName: v })), []);
  const setNewHa = useCallback((v: number) => setState((s) => ({ ...s, newHa: v })), []);
  const setNewTemplate = useCallback(
    (v: TemplateKey) => setState((s) => ({ ...s, newTemplate: v })),
    [],
  );

  const createModel = useCallback(() => {
    setState((s) => {
      const id = Math.max(...s.models.map((x) => x.id)) + 1;
      const name = s.newName.trim() || 'Nuevo modelo ' + id;
      const nm: FinModel = {
        id,
        name,
        crop: 'olivo',
        region: 'Nueva ubicación',
        status: 'Borrador',
        updated: 'ahora',
        shared: 'solo tú',
        a: baseA({ superficie: s.newHa || 100 }),
      };
      return {
        ...s,
        models: s.models.concat([nm]),
        showNew: false,
        activeId: id,
        screen: 'editor',
        etab: 'supuestos',
      };
    });
    flash('Modelo creado');
  }, [flash]);

  const saveScenario = useCallback((sc: Scenario) => {
    setState((s) => ({ ...s, scenario: sc }));
    flash('Escenario guardado para comparar');
  }, [flash]);
  const clearScenario = useCallback(() => setState((s) => ({ ...s, scenario: null })), []);

  return useMemo(
    () => ({
      state,
      active,
      edVal,
      login,
      logout,
      gotoDash,
      gotoAdmin,
      gotoResults,
      gotoEditor,
      openModel,
      openResults,
      setEtab,
      onNumFocus,
      onNumBlur,
      onField,
      onCapexField,
      onOpexField,
      onProjHaField,
      cyclePerm,
      invite,
      save,
      exportXlsx,
      exportPdf,
      openNew,
      closeNew,
      setNewName,
      setNewHa,
      setNewTemplate,
      createModel,
      saveScenario,
      clearScenario,
      flash,
    }),
    [
      state,
      active,
      edVal,
      login,
      logout,
      gotoDash,
      gotoAdmin,
      gotoResults,
      gotoEditor,
      openModel,
      openResults,
      setEtab,
      onNumFocus,
      onNumBlur,
      onField,
      onCapexField,
      onOpexField,
      onProjHaField,
      cyclePerm,
      invite,
      save,
      exportXlsx,
      exportPdf,
      openNew,
      closeNew,
      setNewName,
      setNewHa,
      setNewTemplate,
      createModel,
      saveScenario,
      clearScenario,
      flash,
    ],
  );
}

const AppContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const store = useAppStore();
  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

export function useApp(): AppStore {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
