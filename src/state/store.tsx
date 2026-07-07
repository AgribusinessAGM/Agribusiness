import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  AccessLevel,
  AppUser,
  Assumptions,
  CurrentUser,
  EditorTab,
  FinModel,
  Scenario,
  Screen,
  TemplateKey,
} from '../types';
import { blankA, buildSeed } from '../data/seed';
import { fmt2, parseNum } from '../engine/format';
import * as api from '../api';

export interface AppState {
  screen: Screen;
  activeId: number;
  etab: EditorTab;
  models: FinModel[];
  users: AppUser[];
  currentUser: CurrentUser | null;
  loginEmail: string;
  loginPassword: string;
  loginError: string | null;
  loginPending: boolean;
  showNew: boolean;
  newName: string;
  newHa: number;
  newTemplate: TemplateKey;
  showInvite: boolean;
  inviteMode: 'email' | 'direct';
  inviteName: string;
  inviteEmail: string;
  inviteOrg: string;
  invitePassword: string;
  inviteError: string | null;
  inviteDevLink: string | null;
  invitePending: boolean;
  resetUserId: number | null;
  resetPassword: string;
  resetError: string | null;
  resetPending: boolean;
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
    users: [],
    currentUser: null,
    loginEmail: 'm.ferrer@iberocrops.com',
    loginPassword: '',
    loginError: null,
    loginPending: false,
    showNew: false,
    newName: '',
    newHa: 100,
    newTemplate: 'olivo',
    showInvite: false,
    inviteMode: 'direct',
    inviteName: '',
    inviteEmail: '',
    inviteOrg: '',
    invitePassword: '',
    inviteError: null,
    inviteDevLink: null,
    invitePending: false,
    resetUserId: null,
    resetPassword: '',
    resetError: null,
    resetPending: false,
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
  setLoginEmail: (v: string) => void;
  setLoginPassword: (v: string) => void;
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
  cyclePerm: (userId: number, modelId: number) => void;
  openInvite: () => void;
  closeInvite: () => void;
  setInviteMode: (m: 'email' | 'direct') => void;
  setInviteName: (v: string) => void;
  setInviteEmail: (v: string) => void;
  setInviteOrg: (v: string) => void;
  setInvitePassword: (v: string) => void;
  submitInvite: () => void;
  openResetPassword: (userId: number) => void;
  closeResetPassword: () => void;
  setResetPassword: (v: string) => void;
  submitResetPassword: () => void;
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

const PERM_ORDER: Record<AccessLevel, AccessLevel> = { none: 'view', view: 'edit', edit: 'none' };

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

  const loadUsers = useCallback(async () => {
    try {
      const users = await api.fetchUsers();
      setState((s) => ({ ...s, users }));
    } catch {
      // silent — la lista de usuarios solo importa en la pantalla de Admin
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const setLoginEmail = useCallback((v: string) => setState((s) => ({ ...s, loginEmail: v, loginError: null })), []);
  const setLoginPassword = useCallback((v: string) => setState((s) => ({ ...s, loginPassword: v, loginError: null })), []);

  const login = useCallback(() => {
    setState((s) => ({ ...s, loginPending: true, loginError: null }));
    api
      .login(state.loginEmail, state.loginPassword)
      .then(({ user }) => {
        setState((s) => ({ ...s, screen: 'dashboard', currentUser: user, loginPending: false, loginPassword: '' }));
        loadUsers(); // el estado (invitado/activo) o los permisos pueden haber cambiado desde la última carga
      })
      .catch((e: Error) => {
        setState((s) => ({ ...s, loginPending: false, loginError: e.message }));
      });
  }, [state.loginEmail, state.loginPassword, loadUsers]);

  const logout = useCallback(
    () => setState((s) => ({ ...s, screen: 'login', currentUser: null, loginPassword: '' })),
    [],
  );
  const gotoDash = useCallback(() => setState((s) => ({ ...s, screen: 'dashboard' })), []);
  const gotoAdmin = useCallback(() => {
    setState((s) => ({ ...s, screen: 'admin' }));
    loadUsers();
  }, [loadUsers]);
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

  const cyclePerm = useCallback(
    (userId: number, modelId: number) => {
      const current = state.users.find((u) => u.id === userId);
      if (!current) return;
      const next = PERM_ORDER[current.access[modelId] || 'none'];
      setState((s) => ({
        ...s,
        users: s.users.map((u) =>
          u.id === userId ? { ...u, access: { ...u.access, [modelId]: next } } : u,
        ),
      }));
      api.setAccess(userId, modelId, next).catch(() => {
        flash('No se pudo actualizar el permiso');
        loadUsers();
      });
    },
    [state.users, flash, loadUsers],
  );

  const openInvite = useCallback(
    () =>
      setState((s) => ({
        ...s,
        showInvite: true,
        inviteName: '',
        inviteEmail: '',
        inviteOrg: '',
        invitePassword: '',
        inviteError: null,
        inviteDevLink: null,
      })),
    [],
  );
  const closeInvite = useCallback(() => setState((s) => ({ ...s, showInvite: false })), []);
  const setInviteMode = useCallback(
    (m: 'email' | 'direct') => setState((s) => ({ ...s, inviteMode: m, inviteError: null })),
    [],
  );
  const setInviteName = useCallback((v: string) => setState((s) => ({ ...s, inviteName: v })), []);
  const setInviteEmail = useCallback((v: string) => setState((s) => ({ ...s, inviteEmail: v })), []);
  const setInviteOrg = useCallback((v: string) => setState((s) => ({ ...s, inviteOrg: v })), []);
  const setInvitePassword = useCallback((v: string) => setState((s) => ({ ...s, invitePassword: v })), []);

  const submitInvite = useCallback(() => {
    const { inviteMode, inviteName, inviteEmail, inviteOrg, invitePassword } = state;
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setState((s) => ({ ...s, inviteError: 'Nombre y correo son obligatorios.' }));
      return;
    }
    if (inviteMode === 'direct' && invitePassword.length < 8) {
      setState((s) => ({ ...s, inviteError: 'La contraseña debe tener al menos 8 caracteres.' }));
      return;
    }
    setState((s) => ({ ...s, invitePending: true, inviteError: null }));

    const addOrReplaceUser = (user: AppUser) => (s: AppState) => ({
      ...s,
      users: s.users.some((u) => u.id === user.id)
        ? s.users.map((u) => (u.id === user.id ? user : u))
        : s.users.concat([user]),
    });

    if (inviteMode === 'direct') {
      api
        .createUser({ name: inviteName, email: inviteEmail, org: inviteOrg, password: invitePassword })
        .then(({ user }) => {
          setState((s) => ({ ...addOrReplaceUser(user)(s), invitePending: false, showInvite: false }));
          flash('Usuario creado');
        })
        .catch((e: Error) => {
          setState((s) => ({ ...s, invitePending: false, inviteError: e.message }));
        });
    } else {
      api
        .inviteUser({ name: inviteName, email: inviteEmail, org: inviteOrg })
        .then(({ user, devLink }) => {
          setState((s) => ({
            ...addOrReplaceUser(user)(s),
            invitePending: false,
            inviteDevLink: devLink || null,
            showInvite: devLink ? s.showInvite : false,
          }));
          flash(devLink ? 'Invitación creada (sin proveedor de email real configurado)' : 'Invitación enviada por correo');
        })
        .catch((e: Error) => {
          setState((s) => ({ ...s, invitePending: false, inviteError: e.message }));
        });
    }
  }, [state.inviteMode, state.inviteName, state.inviteEmail, state.inviteOrg, state.invitePassword, flash]);

  const openResetPassword = useCallback(
    (userId: number) =>
      setState((s) => ({ ...s, resetUserId: userId, resetPassword: '', resetError: null })),
    [],
  );
  const closeResetPassword = useCallback(() => setState((s) => ({ ...s, resetUserId: null })), []);
  const setResetPassword = useCallback((v: string) => setState((s) => ({ ...s, resetPassword: v })), []);

  const submitResetPassword = useCallback(() => {
    const { resetUserId, resetPassword } = state;
    if (resetUserId == null) return;
    if (resetPassword.length < 8) {
      setState((s) => ({ ...s, resetError: 'La contraseña debe tener al menos 8 caracteres.' }));
      return;
    }
    setState((s) => ({ ...s, resetPending: true, resetError: null }));
    api
      .resetPassword(resetUserId, resetPassword)
      .then(() => {
        setState((s) => ({
          ...s,
          resetPending: false,
          resetUserId: null,
          users: s.users.map((u) => (u.id === resetUserId ? { ...u, status: 'active' } : u)),
        }));
        flash('Contraseña actualizada');
      })
      .catch((e: Error) => {
        setState((s) => ({ ...s, resetPending: false, resetError: e.message }));
      });
  }, [state.resetUserId, state.resetPassword, flash]);

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
        crop: s.newTemplate === 'almendro' ? 'almendro' : 'olivo',
        region: 'Nueva ubicación',
        status: 'Borrador',
        updated: 'ahora',
        shared: 'solo tú',
        a: blankA(s.newHa || 100),
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
      setLoginEmail,
      setLoginPassword,
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
      openInvite,
      closeInvite,
      setInviteMode,
      setInviteName,
      setInviteEmail,
      setInviteOrg,
      setInvitePassword,
      submitInvite,
      openResetPassword,
      closeResetPassword,
      setResetPassword,
      submitResetPassword,
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
      setLoginEmail,
      setLoginPassword,
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
      openInvite,
      closeInvite,
      setInviteMode,
      setInviteName,
      setInviteEmail,
      setInviteOrg,
      setInvitePassword,
      submitInvite,
      openResetPassword,
      closeResetPassword,
      setResetPassword,
      submitResetPassword,
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
