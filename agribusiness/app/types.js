// Formas de los datos de la app. Solo documentación (JSDoc): el navegador no
// la usa, pero los editores como VS Code la entienden y ayudan a autocompletar.

/** @typedef {'ha' | 'ud'} CapexUnit */

/**
 * @typedef {Object} CapexItem
 * @property {string} key
 * @property {string} label
 * @property {number} v
 */

/**
 * @typedef {Object} CapexGroup
 * @property {string} key
 * @property {string} title
 * @property {CapexUnit} unit
 * @property {CapexItem[]} items
 */

/**
 * @typedef {Object} OpexItem
 * @property {string} key
 * @property {string} label
 * @property {string} unidad
 * @property {number} cant
 * @property {number} coste
 * @property {number} base
 * @property {number[]} sched
 */

/**
 * @typedef {Object} OpexCategory
 * @property {string} key
 * @property {string} label
 * @property {OpexItem[]} items
 */

/**
 * @typedef {Object} Assumptions
 * @property {number} superficie
 * @property {number} marcoN
 * @property {number} marcoM
 * @property {number} precioEVOO
 * @property {number} prodPlena
 * @property {number} alquiler
 * @property {number} personal
 * @property {number} inflacion
 * @property {number} is
 * @property {number} financiacion
 * @property {number} interes
 * @property {number} plazo
 * @property {number} carencia
 * @property {number} capexFee
 * @property {number} opexFee
 * @property {number} fondoCost
 * @property {number} duracionProyecto
 * @property {CapexGroup[]} capexGroups
 * @property {OpexCategory[]} opexItems
 */

/** @typedef {'olivo' | 'almendro'} CropType */
/** @typedef {'Activo' | 'Borrador'} ModelStatus */
/** @typedef {'edit' | 'view' | 'none'} AccessLevel */
/** @typedef {'invited' | 'active'} UserStatus */
/** @typedef {'admin' | 'user'} UserRole */

/**
 * @typedef {Object} FinModel
 * @property {number} id
 * @property {string} name
 * @property {CropType} crop
 * @property {string} region
 * @property {ModelStatus} status
 * @property {string} updated
 * @property {string} shared
 * @property {AccessLevel} myAccess
 * @property {Assumptions} a
 */

/**
 * @typedef {Object} AppUser
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {string} org
 * @property {UserStatus} status
 * @property {UserRole} role
 * @property {Record<number, AccessLevel>} access
 */

/**
 * @typedef {Object} CurrentUser
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {string} org
 * @property {UserRole} role
 */

/** @typedef {'login' | 'dashboard' | 'editor' | 'results' | 'admin'} Screen */
/** @typedef {'supuestos' | 'capex' | 'opex' | 'rent' | 'fin'} EditorTab */
/** @typedef {'olivo' | 'almendro' | 'blank'} TemplateKey */

/**
 * @typedef {Object} Scenario
 * @property {number | null} tirA
 * @property {number | null} tirL
 * @property {number | null} tirF
 * @property {number} van
 * @property {number} ebitda
 */

export {};
