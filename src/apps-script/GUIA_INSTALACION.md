# GUÍA COMPLETA DE INSTALACIÓN - VARIEDADES CS
### Sistema de Inventario y Punto de Venta en Google Sheets & Google Apps Script

---

## PASO 1: Cómo crear el proyecto de Apps Script
1. Abre tu navegador e ingresa a [Google Sheets](https://sheets.google.com).
2. Crea una nueva hoja de cálculo en blanco haciendo clic en **"+ En blanco"**.
3. Asigna el nombre a la hoja de cálculo en la esquina superior izquierda: `VARIEDADES CS - Base de Datos`.
4. En el menú superior de Google Sheets, haz clic en **Extensiones** > **Apps Script**.
5. Se abrirá una nueva pestaña con el editor de código de Google Apps Script.
6. En la parte superior izquierda, haz clic en "Proyecto sin título" y cámbialo por: `VARIEDADES CS - Backend`.

---

## PASO 2: Cómo crear las hojas
¡No necesitas crearlas a mano una por una!
El sistema incluye la función automatizada `configurarSistema()` dentro de `Código.gs`, la cual crea todas las siguientes hojas automáticamente con sus encabezados oficiales, colores y formatos:
- `Productos` (Código, Producto, Categoría, Existencia, Precio Compra, Precio Venta)
- `Movimientos` (Fecha, Código, Producto, Categoría, Tipo, Cantidad, Precio Unitario, Total)
- `Ventas` (N° Venta, Fecha, Código, Producto, Categoría, Cantidad, Precio Unitario, Total, Forma de Pago, Fecha Vencimiento, N° Crédito, Usuario, Estado, Fecha Anulación, Motivo)
- `Compras` (N° Compra, Fecha, Código, Producto, Categoría, Cantidad, Precio Unitario, Total)
- `Clientes` (ID Cliente, Nombre, Teléfono, Dirección, Observaciones)
- `Proveedores` (ID Proveedor, Nombre, Teléfono, Dirección, Observaciones)
- `Creditos` (N° Crédito, Fecha, ID Cliente, Cliente, N° Venta, Total Crédito, Abonado, Saldo, Vencimiento, Estado)
- `Abonos` (N° Abono, Fecha, N° Crédito, ID Cliente, Cliente, Monto Abonado, Método de Pago, Observaciones)
- `Cuentas por Cobrar` (ID Cliente, Cliente, Total Créditos, Total Abonado, Saldo Pendiente, Créditos Pendientes, Estado)
- `Caja` (ID, Fecha, Tipo, Concepto, Monto, Usuario, Saldo)
- `Inventario` (Código, Producto, Categoría, Existencia, Precio Compra, Precio Venta, Valor Total)
- `Dashboard` (Métrica, Valor, Última Actualización)
- `Usuarios` (Usuario, Contraseña, Rol)

*(Se crean automáticamente en el PASO 5).*

---

## PASO 3: Dónde pegar Código.gs
1. En el editor de Apps Script, verás en el panel izquierdo bajo la sección **Archivos** un archivo llamado `Código.gs` (o `Code.gs`).
2. Haz clic sobre él.
3. Borra cualquier código existente (como `function myFunction() {}`).
4. Copia todo el contenido del archivo `Código.gs` y pégalo en el editor.
5. Presiona el botón de **Guardar** (ícono de disquete o `Ctrl + S`).

---

## PASO 4: Dónde crear Index.html
1. En el panel izquierdo de Apps Script, junto a la palabra **Archivos**, haz clic en el botón **+** (Añadir un archivo).
2. Selecciona la opción **HTML**.
3. Como nombre escribe exactamente: `Index` (con I mayúscula, tal como espera `HtmlService.createHtmlOutputFromFile('Index')`).
4. Se creará el archivo `Index.html`.
5. Borra la plantilla que Google coloca por defecto.
6. Copia todo el contenido del archivo `Index.html` y pégalo allí.
7. Guarda los cambios con `Ctrl + S` o el ícono de disquete.

---

## PASO 5: Cómo ejecutar la función de configuración inicial
1. En la barra de herramientas superior de Apps Script, localiza el menú desplegable de funciones (a la derecha del botón "Depurar").
2. Haz clic en el desplegable y selecciona la función: `configurarSistema`.
3. Haz clic en el botón **Ejecutar** (ícono de triángulo de reproducción).
4. La primera vez que lo ejecutes, Google te solicitará autorizar permisos (ver PASO 7).
5. Tras autorizar, la ejecución se completará en unos segundos mostrando "Ejecución iniciada" y "Ejecución finalizada".
6. Regresa a tu Google Sheet: ¡verás todas las hojas creadas con sus encabezados y productos de ejemplo listos!

---

## PASO 6: Cómo implementar como aplicación web
1. En la esquina superior derecha del editor de Apps Script, haz clic en el botón azul **Implementar** (Deploy).
2. Selecciona **Nueva implementación** (New deployment).
3. En la ventana modal, haz clic en el ícono de engranaje ⚙️ junto a "Seleccionar tipo" y elige **Aplicación web** (Web app).
4. Llena los siguientes campos:
   - **Descripción**: `VARIEDADES CS v1.0`
   - **Ejecutar como**: `Yo (tu correo de Google)` (esto permite que los usuarios interactúen con la base de datos sin requerir permisos directos a la hoja).
   - **Quién tiene acceso**: `Cualquier usuario` (Anyone) o `Cualquier usuario con cuenta de Google` según tu preferencia.
5. Haz clic en el botón **Implementar** (Deploy).

---

## PASO 7: Qué permisos aceptar
Cuando Google muestre el mensaje de "Autorización requerida":
1. Haz clic en **Revisar permisos** (Review Permissions).
2. Selecciona tu cuenta de Google.
3. Si aparece la advertencia "Google no ha verificado esta aplicación" (pantalla de seguridad estándar de Apps Script), haz clic en el enlace inferior **Configuración avanzada** (Advanced).
4. Haz clic en el enlace inferior que dice **Ir a VARIEDADES CS - Backend (no seguro)** (Go to ... unsafe).
5. En la siguiente pantalla, revisa los permisos (ver y administrar hojas de cálculo de Google Drive) y haz clic en **Permitir** (Allow).

---

## PASO 8: Cómo abrir la aplicación
1. Al finalizar la implementación, Google Apps Script te mostrará una ventana con la **URL de la aplicación web** (termina en `/exec`).
2. Haz clic en **Copiar** o haz clic directamente en el enlace para abrir la aplicación.
3. Guarda esa URL en tus favoritos de tu computadora, tablet o agrega un acceso directo a la pantalla de inicio en tu teléfono celular.
4. Ingresa con los usuarios oficiales:
   - Usuario: `JENIFER SANCHEZ` | Contraseña: `12345`
   - Usuario: `URIEL ROQUES` | Contraseña: `12345`
*(Puedes cambiar las contraseñas en cualquier momento directamente en la hoja `Usuarios` de tu Google Sheet).*
