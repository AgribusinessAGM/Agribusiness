// "html" sustituye a JSX: es una plantilla de texto que el navegador entiende
// sin compilar. Se escribe como JSX con estas diferencias:
//   - valores y eventos con ${…}:      <div style=${{ color: 'red' }} onClick=${fn}>
//   - componentes con ${…}:            <${Boton} texto="Hola" />
//   - cierre de un componente:         <${Tarjeta}>…<//>
//   - entidades HTML (&nbsp;…) no se traducen: usar el carácter o ${' '}.
import { createElement } from 'react';
import htm from 'htm';

export const html = htm.bind(createElement);
