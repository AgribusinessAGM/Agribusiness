import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { html } from '../lib/html.js';
import { blankA } from '../data/seed.js';
import { PRICE_VAR_IAG } from '../data/iag.js';
import { fmt2, parseNum, setNumLang, stripGrouping } from '../engine/format.js';
import { tr } from '../i18n/translate.js';
import * as api from '../api.js';

// Estado global de la app y todas las acciones que lo cambian. Los componentes
// lo leen con useApp().

// Partidas de plantación que se excluyen entre sí (Sistema Plantación 1 manual / 2 mecánica)
// y Método plantación 1 (espaldera + protector) / 2 (tutor + protector)
const EXCLUSIVE = { manual: 'mechanical', mechanical: 'manual', trellis: 'stake', stake: 'trellis' };

function savedLang() {
  try {
    return localStorage.getItem('om_lang') === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

function initialState() {
  return {
    booting: true,
    lang: savedLang(), // 'es' | 'en' (lo traduce app/i18n/translate.js)
    screen: 'login', // 'login' | 'dashboard' | 'editor' | 'results' | 'admin'
    activeId: 1,
    etab: 'supuestos', // pestaña del editor: 'supuestos' | 'capex' | 'opex' | 'rent' | 'fin' | 'precio' | 'informe'
    models: [],
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
    inviteMode: 'direct', // 'email' | 'direct'
    inviteName: '',
    inviteEmail: '',
    inviteOrg: '',
    invitePassword: '',
    inviteRole: 'user',
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

function inpId(ds) {
  if (ds.pidx != null) return 'pv:' + ds.pidx;
  if (ds.schedy != null) return 'os:' + ds.catkey + '.' + ds.itkey + ':' + ds.schedy;
  if (ds.opfld) return 'op:' + ds.opfld + ':' + ds.catkey + '.' + ds.itkey;
  if (ds.gkey) return 'cap:' + ds.gkey + '.' + ds.ikey;
  return 'sup:' + ds.key;
}

const PERM_ORDER = { none: 'view', view: 'edit', edit: 'none' };

export function useAppStore() {
  const [state, setState] = useState(initialState);
  const toastTimer = useRef(undefined);
  // Los formateadores de números leen el idioma de aquí, antes de pintar.
  setNumLang(state.lang);

  const setLang = useCallback((l) => {
    const v = l === 'en' ? 'en' : 'es';
    try {
      localStorage.setItem('om_lang', v);
    } catch {
      // sin almacenamiento local: el idioma dura lo que la pestaña
    }
    setState((s) => ({ ...s, lang: v, editKey: null, editRaw: '' }));
  }, []);

  const active = useCallback(
    () => state.models.find((m) => m.id === state.activeId) || state.models[0],
    [state.models, state.activeId],
  );

  const canEdit = useMemo(() => {
    if (state.currentUser?.role === 'admin') return true;
    const m = active();
    return m?.myAccess === 'edit';
  }, [state.currentUser, active]);

  const edVal = useCallback(
    (id, val) => (state.editKey === id ? state.editRaw : fmt2(val)),
    [state.editKey, state.editRaw],
  );

  const flash = useCallback((msg) => {
    setState((s) => ({ ...s, toast: msg }));
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setState((s) => ({ ...s, toast: null })), 2200);
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const users = await api.fetchUsers();
      setState((s) => ({ ...s, users }));
    } catch {
      // silencioso — solo importa en la pantalla de Admin, y ahí solo entra un admin
    }
  }, []);

  const loadModels = useCallback(async () => {
    try {
      const models = await api.fetchModels();
      setState((s) => ({
        ...s,
        models,
        activeId: models.some((m) => m.id === s.activeId) ? s.activeId : models[0]?.id ?? s.activeId,
      }));
    } catch {
      // silencioso — un fallo puntual no debe tirar la app entera
    }
  }, []);

  const bootstrapAfterAuth = useCallback(
    (user) => {
      loadModels();
      if (user.role === 'admin') loadUsers();
    },
    [loadModels, loadUsers],
  );

  // Restaura la sesión si ya había un token guardado (recarga de página, etc.)
  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setState((s) => ({ ...s, booting: false }));
      return;
    }
    api
      .getMe()
      .then(({ user }) => {
        setState((s) => ({ ...s, currentUser: user, screen: 'dashboard', booting: false }));
        bootstrapAfterAuth(user);
      })
      .catch(() => {
        api.clearToken();
        setState((s) => ({ ...s, booting: false }));
      });
  }, []);

  const setLoginEmail = useCallback((v) => setState((s) => ({ ...s, loginEmail: v, loginError: null })), []);
  const setLoginPassword = useCallback((v) => setState((s) => ({ ...s, loginPassword: v, loginError: null })), []);

  const login = useCallback(() => {
    setState((s) => ({ ...s, loginPending: true, loginError: null }));
    api
      .login(state.loginEmail, state.loginPassword)
      .then(({ token, user }) => {
        api.setToken(token);
        setState((s) => ({ ...s, screen: 'dashboard', currentUser: user, loginPending: false, loginPassword: '' }));
        bootstrapAfterAuth(user);
      })
      .catch((e) => {
        setState((s) => ({ ...s, loginPending: false, loginError: e.message }));
      });
  }, [state.loginEmail, state.loginPassword, bootstrapAfterAuth]);

  const logout = useCallback(() => {
    api.clearToken();
    setState((s) => ({ ...s, screen: 'login', currentUser: null, loginPassword: '', models: [], users: [] }));
  }, []);

  const gotoDash = useCallback(() => setState((s) => ({ ...s, screen: 'dashboard' })), []);
  const gotoAdmin = useCallback(() => {
    setState((s) => ({ ...s, screen: 'admin' }));
    loadUsers();
  }, [loadUsers]);
  const gotoResults = useCallback(() => setState((s) => ({ ...s, screen: 'results' })), []);
  const gotoEditor = useCallback(() => setState((s) => ({ ...s, screen: 'editor' })), []);

  const openModel = useCallback(
    (id) => setState((s) => ({ ...s, activeId: id, screen: 'editor', etab: 'supuestos' })),
    [],
  );
  const openResults = useCallback(
    (id) => setState((s) => ({ ...s, activeId: id, screen: 'results' })),
    [],
  );
  const setEtab = useCallback((key) => setState((s) => ({ ...s, etab: key })), []);

  const onNumFocus = useCallback((id, currentDisplay) => {
    const raw = stripGrouping(currentDisplay);
    setState((s) => ({ ...s, editKey: id, editRaw: raw === '0' ? '' : raw }));
  }, []);
  const onNumBlur = useCallback(() => {
    setState((s) => ({ ...s, editKey: null, editRaw: '' }));
  }, []);

  const isActiveEditable = (s) => {
    if (s.currentUser?.role === 'admin') return true;
    const m = s.models.find((x) => x.id === s.activeId);
    return m?.myAccess === 'edit';
  };

  // estado del proyecto (Activo / Borrador); se guarda con "Guardar cambios"
  const onStatus = useCallback((status) => {
    setState((s) => {
      if (!isActiveEditable(s)) return s;
      return { ...s, models: s.models.map((m) => (m.id === s.activeId ? { ...m, status } : m)) };
    });
  }, []);

  const onField = useCallback((key, raw) => {
    const v = parseNum(raw);
    setState((s) => {
      if (!isActiveEditable(s)) return s;
      return {
        ...s,
        editKey: inpId({ key }),
        editRaw: raw,
        models: s.models.map((m) => (m.id === s.activeId ? { ...m, a: { ...m.a, [key]: v } } : m)),
      };
    });
  }, []);

  const onCapexField = useCallback((gkey, ikey, raw) => {
    const v = parseNum(raw);
    setState((s) => {
      if (!isActiveEditable(s)) return s;
      return {
        ...s,
        editKey: inpId({ gkey, ikey }),
        editRaw: raw,
        models: s.models.map((m) => {
          if (m.id !== s.activeId) return m;
          const groups = m.a.capexGroups.map((g) =>
            g.key !== gkey
              ? g
              : {
                  ...g,
                  items: g.items.map((it) =>
                    it.key === ikey
                      ? { ...it, v }
                      : // sistemas de plantación excluyentes: con valor en uno, el otro pasa a 0
                        gkey === 'plant' && +v && EXCLUSIVE[ikey] === it.key
                        ? { ...it, v: 0 }
                        : it,
                  ),
                },
          );
          return { ...m, a: { ...m.a, capexGroups: groups } };
        }),
      };
    });
  }, []);

  // field: 'cant' | 'coste'
  const onOpexField = useCallback(
    (catkey, itkey, field, raw) => {
      const v = parseNum(raw);
      setState((s) => {
        if (!isActiveEditable(s)) return s;
        return {
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
        };
      });
    },
    [],
  );

  // Importe €/Ha (sin inflación) de una sub-partida OPEX en el año yIdx+1 de su calendario;
  // se guarda en la escala del calendario (sched × cant×coste/base = €/Ha)
  const onOpexSched = useCallback((catkey, itkey, yIdx, raw) => {
    const v = parseNum(raw);
    setState((s) => {
      if (!isActiveEditable(s)) return s;
      return {
        ...s,
        editKey: inpId({ schedy: yIdx, catkey, itkey }),
        editRaw: raw,
        models: s.models.map((m) => {
          if (m.id !== s.activeId) return m;
          const cats = m.a.opexItems.map((c) =>
            c.key !== catkey
              ? c
              : {
                  ...c,
                  items: c.items.map((it) => {
                    if (it.key !== itkey) return it;
                    const base = +it.base || 0;
                    const scale = base > 0 ? ((+it.cant || 0) * (+it.coste || 0)) / base : 1;
                    const sched = [...it.sched];
                    const sv = scale > 0 ? v / scale : v;
                    // el año 5 ("Constante 5–35") fija el importe de todos los años siguientes
                    if (yIdx === 4) for (let k = 4; k < sched.length; k++) sched[k] = sv;
                    else sched[yIdx] = sv;
                    return { ...it, sched };
                  }),
                },
          );
          return { ...m, a: { ...m.a, opexItems: cats } };
        }),
      };
    });
  }, []);

  // Variación % del precio del año idx+1 (pestaña Precio, modelo IAG)
  const onPriceVar = useCallback((idx, raw) => {
    const v = parseNum(raw) / 100;
    setState((s) => {
      if (!isActiveEditable(s)) return s;
      return {
        ...s,
        editKey: inpId({ pidx: idx }),
        editRaw: raw,
        models: s.models.map((m) => {
          if (m.id !== s.activeId) return m;
          // Sin huecos: los años anteriores sin variación quedan a 0
          const old = m.a.priceVar || [];
          const pv = Array.from({ length: Math.max(old.length, idx + 1) }, (_, i) => +old[i] || 0);
          pv[idx] = v;
          return { ...m, a: { ...m.a, priceVar: pv } };
        }),
      };
    });
  }, []);

  const resetPriceVar = useCallback(() => {
    setState((s) => {
      if (!isActiveEditable(s)) return s;
      return {
        ...s,
        editKey: null,
        // IAG vuelve al ciclo de su Excel; el resto, a precio constante
        models: s.models.map((m) =>
          m.id === s.activeId
            ? { ...m, a: { ...m.a, priceVar: m.a.engine === 'iag' ? PRICE_VAR_IAG.slice() : [] } }
            : m,
        ),
      };
    });
    flash('Variaciones de precio restauradas');
  }, []);

  const onProjHaField = useCallback((raw) => {
    const v = parseNum(raw);
    setState((s) => ({ ...s, editKey: 'ui:projHa', editRaw: raw, projHa: v }));
  }, []);

  const cyclePerm = useCallback(
    (userId, modelId) => {
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

  // Acceso en bloque (pestaña Accesos): pairs = [[userId, modelId], …] al mismo nivel
  const setPermsBulk = useCallback(
    (pairs, level) => {
      if (!pairs.length) return;
      setState((s) => ({
        ...s,
        users: s.users.map((u) => {
          const mine = pairs.filter(([uid]) => uid === u.id);
          if (!mine.length) return u;
          const access = { ...u.access };
          for (const [, mid] of mine) access[mid] = level;
          return { ...u, access };
        }),
      }));
      Promise.all(pairs.map(([uid, mid]) => api.setAccess(uid, mid, level))).catch(() => {
        flash('No se pudo actualizar el permiso');
        loadUsers();
      });
    },
    [flash, loadUsers],
  );

  // Perfil (pestaña Perfiles): nombre, correo y organización; devuelve la promesa para que
  // el formulario pueda mostrar el error de la API (p. ej. correo repetido)
  const updateProfile = useCallback(
    (userId, profile) =>
      api.updateProfile(userId, profile).then((res) => {
        setState((s) => ({
          ...s,
          users: s.users.map((u) => (u.id === userId ? { ...u, name: res.name, email: res.email, org: res.org } : u)),
          currentUser: s.currentUser?.id === userId ? { ...s.currentUser, name: res.name, email: res.email, org: res.org } : s.currentUser,
        }));
        flash('Perfil actualizado');
      }),
    [flash],
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
        inviteRole: 'user',
        inviteError: null,
        inviteDevLink: null,
      })),
    [],
  );
  const closeInvite = useCallback(() => setState((s) => ({ ...s, showInvite: false })), []);
  const setInviteMode = useCallback(
    (m) => setState((s) => ({ ...s, inviteMode: m, inviteError: null })),
    [],
  );
  const setInviteName = useCallback((v) => setState((s) => ({ ...s, inviteName: v })), []);
  const setInviteEmail = useCallback((v) => setState((s) => ({ ...s, inviteEmail: v })), []);
  const setInviteOrg = useCallback((v) => setState((s) => ({ ...s, inviteOrg: v })), []);
  const setInvitePassword = useCallback((v) => setState((s) => ({ ...s, invitePassword: v })), []);
  const setInviteRole = useCallback((r) => setState((s) => ({ ...s, inviteRole: r })), []);

  const submitInvite = useCallback(() => {
    const { inviteMode, inviteName, inviteEmail, inviteOrg, invitePassword, inviteRole } = state;
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setState((s) => ({ ...s, inviteError: 'Nombre y correo son obligatorios.' }));
      return;
    }
    if (inviteMode === 'direct' && invitePassword.length < 8) {
      setState((s) => ({ ...s, inviteError: 'La contraseña debe tener al menos 8 caracteres.' }));
      return;
    }
    setState((s) => ({ ...s, invitePending: true, inviteError: null }));

    const addOrReplaceUser = (user) => (s) => ({
      ...s,
      users: s.users.some((u) => u.id === user.id)
        ? s.users.map((u) => (u.id === user.id ? user : u))
        : s.users.concat([user]),
    });

    if (inviteMode === 'direct') {
      api
        .createUser({ name: inviteName, email: inviteEmail, org: inviteOrg, password: invitePassword, role: inviteRole })
        .then(({ user }) => {
          setState((s) => ({ ...addOrReplaceUser(user)(s), invitePending: false, showInvite: false }));
          flash('Usuario creado');
        })
        .catch((e) => {
          setState((s) => ({ ...s, invitePending: false, inviteError: e.message }));
        });
    } else {
      api
        .inviteUser({ name: inviteName, email: inviteEmail, org: inviteOrg, role: inviteRole })
        .then(({ user, devLink }) => {
          setState((s) => ({
            ...addOrReplaceUser(user)(s),
            invitePending: false,
            inviteDevLink: devLink || null,
            showInvite: devLink ? s.showInvite : false,
          }));
          flash(devLink ? 'Invitación creada (sin proveedor de email real configurado)' : 'Invitación enviada por correo');
        })
        .catch((e) => {
          setState((s) => ({ ...s, invitePending: false, inviteError: e.message }));
        });
    }
  }, [state.inviteMode, state.inviteName, state.inviteEmail, state.inviteOrg, state.invitePassword, state.inviteRole, flash]);

  const setUserRole = useCallback(
    (userId, role) => {
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === userId ? { ...u, role } : u)),
      }));
      api.setUserRole(userId, role).catch(() => {
        flash('No se pudo actualizar el rol');
        loadUsers();
      });
    },
    [flash, loadUsers],
  );

  const deleteUser = useCallback(
    (userId) => {
      const target = state.users.find((u) => u.id === userId);
      if (!target) return;
      if (!window.confirm(tr(`¿Eliminar a ${target.name}? Perderá el acceso a todos los modelos.`))) return;
      setState((s) => ({ ...s, users: s.users.filter((u) => u.id !== userId) }));
      api.deleteUser(userId).catch(() => {
        flash('No se pudo eliminar la persona');
        loadUsers();
      });
    },
    [state.users, flash, loadUsers],
  );

  const openResetPassword = useCallback(
    (userId) =>
      setState((s) => ({ ...s, resetUserId: userId, resetPassword: '', resetError: null })),
    [],
  );
  const closeResetPassword = useCallback(() => setState((s) => ({ ...s, resetUserId: null })), []);
  const setResetPassword = useCallback((v) => setState((s) => ({ ...s, resetPassword: v })), []);

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
      .catch((e) => {
        setState((s) => ({ ...s, resetPending: false, resetError: e.message }));
      });
  }, [state.resetUserId, state.resetPassword, flash]);

  const save = useCallback(() => {
    const m = active();
    if (!m) return;
    api
      .updateModel(m.id, m)
      .then(({ model }) => {
        setState((s) => ({ ...s, models: s.models.map((x) => (x.id === model.id ? model : x)) }));
        flash('Modelo guardado');
      })
      .catch((e) => flash(e.message || 'No se pudo guardar el modelo'));
  }, [active, flash]);

  const exportXlsx = useCallback(() => flash('Exportando a Excel…'), [flash]);
  // El informe PDF se ve en la pestaña Informe del editor y se imprime (o se guarda como PDF) desde allí.
  const exportPdf = useCallback(() => setState((s) => ({ ...s, screen: 'editor', etab: 'informe' })), []);

  const openNew = useCallback(
    () => setState((s) => ({ ...s, showNew: true, newName: '', newHa: 100, newTemplate: 'olivo' })),
    [],
  );
  const closeNew = useCallback(() => setState((s) => ({ ...s, showNew: false })), []);
  const setNewName = useCallback((v) => setState((s) => ({ ...s, newName: v })), []);
  const setNewHa = useCallback((v) => setState((s) => ({ ...s, newHa: v })), []);
  const setNewTemplate = useCallback(
    (v) => setState((s) => ({ ...s, newTemplate: v })),
    [],
  );

  const createModel = useCallback(() => {
    const { newName, newHa, newTemplate } = state;
    const name = newName.trim() || 'Nuevo modelo';
    const crop = newTemplate === 'almendro' ? 'almendro' : 'olivo';
    const a = blankA(newHa || 100);
    api
      .createModel({ name, crop, region: 'Nueva ubicación', status: 'Borrador', a })
      .then(({ model }) => {
        setState((s) => ({
          ...s,
          models: s.models.concat([model]),
          showNew: false,
          activeId: model.id,
          screen: 'editor',
          etab: 'supuestos',
        }));
        flash('Modelo creado');
      })
      .catch((e) => flash(e.message || 'No se pudo crear el modelo'));
  }, [state.newName, state.newHa, state.newTemplate, flash]);

  // Duplica un modelo: copia todos sus supuestos en uno nuevo, en Borrador, y lo abre
  const duplicateModel = useCallback(
    (id) => {
      const m = state.models.find((x) => x.id === id);
      if (!m) return;
      api
        .createModel({ name: m.name + ' (copia)', crop: m.crop, region: m.region, status: 'Borrador', a: structuredClone(m.a) })
        .then(({ model }) => {
          setState((s) => ({ ...s, models: s.models.concat([model]), activeId: model.id, screen: 'editor', etab: 'supuestos' }));
          flash('Modelo duplicado');
        })
        .catch((e) => flash(e.message || 'No se pudo duplicar el modelo'));
    },
    [state.models, flash],
  );

  // Cambia el nombre de un modelo desde el panel y lo guarda al momento
  const renameModel = useCallback(
    (id, name) => {
      const m = state.models.find((x) => x.id === id);
      const nm = (name || '').trim();
      if (!m || !nm || nm === m.name) return;
      api
        .updateModel(id, { ...m, name: nm })
        .then(({ model }) => {
          setState((s) => ({ ...s, models: s.models.map((x) => (x.id === model.id ? model : x)) }));
          flash('Nombre actualizado');
        })
        .catch((e) => flash(e.message || 'No se pudo cambiar el nombre'));
    },
    [state.models, flash],
  );

  const saveScenario = useCallback((sc) => {
    setState((s) => ({ ...s, scenario: sc }));
    flash('Escenario guardado para comparar');
  }, [flash]);
  const clearScenario = useCallback(() => setState((s) => ({ ...s, scenario: null })), []);

  return useMemo(
    () => ({
      state,
      active,
      setLang,
      canEdit,
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
      onStatus,
      onCapexField,
      onOpexField,
      onOpexSched,
      onProjHaField,
      onPriceVar,
      resetPriceVar,
      cyclePerm,
      setPermsBulk,
      updateProfile,
      openInvite,
      closeInvite,
      setInviteMode,
      setInviteName,
      setInviteEmail,
      setInviteOrg,
      setInvitePassword,
      setInviteRole,
      submitInvite,
      setUserRole,
      deleteUser,
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
      duplicateModel,
      renameModel,
      clearScenario,
      flash,
    }),
    [
      state,
      active,
      setLang,
      canEdit,
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
      onStatus,
      onCapexField,
      onOpexField,
      onOpexSched,
      onProjHaField,
      onPriceVar,
      resetPriceVar,
      cyclePerm,
      setPermsBulk,
      updateProfile,
      openInvite,
      closeInvite,
      setInviteMode,
      setInviteName,
      setInviteEmail,
      setInviteOrg,
      setInvitePassword,
      setInviteRole,
      submitInvite,
      setUserRole,
      deleteUser,
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
      duplicateModel,
      renameModel,
      clearScenario,
      flash,
    ],
  );
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const store = useAppStore();
  return html`<${AppContext.Provider} value=${store}>${children}<//>`;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
