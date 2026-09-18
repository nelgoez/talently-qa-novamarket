# NovaMarket — Propuesta: Criterios de Aceptación y Matriz Inicial de Pruebas

> **Autor**: QA (Nahuel) · **Versión**: 0.1 (borrador para revisión) · **Fecha**: 2026-09-18
> **Estado**: PROPUESTA — sujeta a revisión del equipo (PO, Back, Front, UX/UI) antes de considerarse definitiva.
> **Supuesto de base**: PostgreSQL como motor de datos (según lo conversado; pendiente de ratificar por Backend).

---

## 0. Qué es este documento y para qué sirve

Hola equipo 👋

Esta es una **propuesta inicial** de criterios de aceptación (AC) y de matriz de pruebas para el
MVP de NovaMarket. El objetivo no es imponer nada: es darnos un **punto de partida común** sobre el
cual discutir, corregir y refinar. En un proyecto real, los criterios de aceptación los define
negocio/PO; como todavía no están definidos, QA los redacta acá como borrador para que no partamos
de una hoja en blanco.

Como es una **simulación educativa con despliegue eventual a producción**, nos sirve practicar las
mismas buenas prácticas que usaríamos en un proyecto real, sin la presión de un cliente.

---

## 1. Una aclaración amable sobre los criterios de aceptación

**Recomendación de buenas prácticas (no es obligación, es sugerencia):** en el mundo real, los
criterios de aceptación **nacen de negocio/PO**, porque son ellos quienes saben qué es "correcto"
desde el punto de vista del usuario. QA los toma, los hace verificables, y escribe los casos de
prueba que los validan.

Como acá todavía no hay AC definidos, este documento propone un **borrador de AC** por cada módulo.
La idea es que:

1. **PO / negocio** los revise y ajuste a la visión del producto (o descarte los que no aplican).
2. **QA** los transforme en casos de prueba ejecutables.
3. **Back / Front** los usen como contrato de "qué se considera terminado" para cada pantalla/endpoint.

El borrador está marcado como *PROPUESTA* justamente porque es el input para esa conversación, no el
resultado de ella.

---

## 2. Formato de los AC (para que sean verificables)

Seguimos dos formatos estándar de la industria, según convenga:

- **Dado / Cuando / Entonces (Given/When/Then)** — para flujos con pasos claros. Cada bloque se
  traduce 1:1 en un caso de prueba.
- **Lista de reglas (checklist)** — para condiciones de negocio simples ("si el producto no tiene
  stock…").

Todo AC debe ser **medible y verificable** ("mostrar un mensaje de error" en vez de "funcionar bien").

---

## 3. Actores (según propuesta de Backend v0.1)

| Actor | Autenticación | Capacidades |
|---|---|---|
| **Visitante** | No | Catálogo, detalle de producto, carrito |
| **Cliente** | Sí | Catálogo, carrito, checkout |
| **Administrador** | Sí + rol admin | Gestión de productos, consulta de pedidos |

---

## 4. Módulos y criterios de aceptación propuestos

### 4.1 Autenticación y registro

| ID | AC propuesto (Given/When/Then o regla) |
|---|---|
| AC-AUTH-1 | Dado un visitante en `/register`, cuando completa nombre/email/contraseña válidos y envía, entonces se crea la cuenta y queda autenticado (o es redirigido a login según decisión de Backend). |
| AC-AUTH-2 | Dado un visitante en `/register`, cuando usa un email ya registrado, entonces ve un mensaje de error claro y no se crea la cuenta duplicada. |
| AC-AUTH-3 | Dado un visitante en `/register`, cuando deja campos vacíos o contraseña fuera de la política, entonces ve el error de validación en el campo correspondiente. |
| AC-AUTH-4 | Dado un usuario en `/login`, cuando ingresa credenciales correctas, entonces recibe su token y accede a las áreas de cliente. |
| AC-AUTH-5 | Dado un usuario en `/login`, cuando ingresa credenciales incorrectas, entonces ve un error genérico ("credenciales inválidas") sin revelar qué campo falló. |
| AC-AUTH-6 | Dado un cliente con sesión activa, cuando recarga la página, entonces la sesión se restaura (token rehidratado) sin volver a loguearse. |
| AC-AUTH-7 | Dado un token expirado o inválido, cuando el cliente llama a un endpoint protegido, entonces recibe `401` y la app limpia la sesión y redirige a `/login`. |

### 4.2 Catálogo de productos

| ID | AC propuesto |
|---|---|
| AC-CAT-1 | Dado un visitante en `/products`, cuando carga la página, entonces ve el listado de productos con nombre, precio e imagen. |
| AC-CAT-2 | Dado un catálogo con más de N productos, cuando el visitante navega, entonces ve la paginación y puede avanzar/retroceder de página. |
| AC-CAT-3 | Dado un visitante en el catálogo, cuando escribe un término de búsqueda, entonces ve solo los productos cuyo nombre/descripción coinciden. |
| AC-CAT-4 | Dado un visitante en el catálogo, cuando filtra por categoría, entonces ve solo los productos de esa categoría. |
| AC-CAT-5 | Dado un catálogo sin resultados (búsqueda/filtro), entonces se muestra un estado vacío con acción sugerida (no una página en blanco). |
| AC-CAT-6 | Dado un producto sin stock, cuando aparece en el catálogo, entonces se muestra como "sin stock" (o se omite según decisión de negocio). |

### 4.3 Detalle de producto

| ID | AC propuesto |
|---|---|
| AC-DET-1 | Dado un visitante en `/products/:id`, cuando carga la página, entonces ve galería/imagen, nombre, descripción, precio y stock del producto. |
| AC-DET-2 | Dado un visitante en un producto con stock, cuando hace clic en "Agregar al carrito", entonces el producto se suma al carrito y el contador del navbar se actualiza. |
| AC-DET-3 | Dado un visitante en un producto sin stock, entonces el botón "Agregar al carrito" está deshabilitado (o muestra "sin stock"). |
| AC-DET-4 | Dado un visitante que ingresa una URL de producto inexistente, entonces ve una página de "no encontrado" amigable. |

### 4.4 Carrito

| ID | AC propuesto |
|---|---|
| AC-CART-1 | Dado un visitante con productos en el carrito, cuando recarga la página, entonces el carrito persiste (localStorage). |
| AC-CART-2 | Dado un carrito con ítems, cuando el visitante modifica la cantidad de un ítem, entonces subtotal y total se recalculan. |
| AC-CART-3 | Dado un carrito con ítems, cuando elimina un ítem, entonces el ítem desaparece y el total se actualiza. |
| AC-CART-4 | Dado un carrito vacío, entonces se muestra un estado vacío con enlace al catálogo. |
| AC-CART-5 | Dado un visitante que intenta agregar más unidades que el stock disponible, entonces ve un error/aviso y no puede exceder el stock. |

### 4.5 Checkout y creación de pedido

| ID | AC propuesto |
|---|---|
| AC-CHK-1 | Dado un visitante no autenticado con carrito, cuando intenta ir a `/checkout`, entonces es redirigido a `/login`. |
| AC-CHK-2 | Dado un cliente autenticado con carrito, cuando confirma el checkout, entonces se crea el pedido (`POST /api/orders`) y ve una confirmación. |
| AC-CHK-3 | Dado un cliente que confirma el checkout, entonces el carrito se vacía. |
| AC-CHK-4 | Dado un checkout simulado (sin pagos reales), entonces NO se solicita ningún dato de pago real; solo datos de confirmación del pedido. |
| AC-CHK-5 | Dado un pedido creado, cuando se consulta, entonces refleja los ítems, cantidades y total correctos. |

### 4.6 Panel de administración

| ID | AC propuesto |
|---|---|
| AC-ADM-1 | Dado un cliente sin rol admin, cuando intenta acceder a `/admin`, entonces es redirigido (no puede ver el panel). |
| AC-ADM-2 | Dado un admin en el panel, cuando crea un producto, entonces el producto aparece en el catálogo público. |
| AC-ADM-3 | Dado un admin, cuando edita un producto (precio, stock, nombre), entonces los cambios se reflejan en catálogo y detalle. |
| AC-ADM-4 | Dado un admin, cuando elimina un producto, entonces deja de aparecer en el catálogo. |
| AC-ADM-5 | Dado un admin, cuando consulta pedidos, entonces ve el listado de pedidos con su estado e ítems. |

### 4.7 Navegación y general

| ID | AC propuesto |
|---|---|
| AC-NAV-1 | Dado cualquier visitante, cuando navega, entonces el navbar muestra las opciones correctas según su estado (logueado/no logueado). |
| AC-NAV-2 | Dada una URL inexistente, entonces se muestra una página 404 amigable. |
| AC-NAV-3 | Dado el sitio en mobile y desktop, entonces las vistas principales son usables (mobile-first, breakpoints definidos con UX/UI). |

---

## 5. Matriz inicial de pruebas (trazabilidad feature → AC → caso de prueba)

> Es un **borrador de la RTM** (Requirements Traceability Matrix). Cada fila vincula un caso de
> prueba a un AC. Las columnas `Resultado` y `Evidencia` se completan durante la ejecución.

| # | Caso de prueba | AC | Prioridad | Tipo | Env | Resultado | Evidencia |
|---|---|---|---|---|---|---|---|
| TC-001 | Registro con datos válidos crea cuenta | AC-AUTH-1 | Alta | Funcional | dev | — | — |
| TC-002 | Registro con email duplicado muestra error | AC-AUTH-2 | Alta | Negativo | dev | — | — |
| TC-003 | Registro con campos vacíos muestra validación | AC-AUTH-3 | Media | Negativo | dev | — | — |
| TC-004 | Login con credenciales correctas | AC-AUTH-4 | Alta | Funcional | dev | — | — |
| TC-005 | Login con credenciales incorrectas | AC-AUTH-5 | Alta | Negativo | dev | — | — |
| TC-006 | Sesión persiste al recargar | AC-AUTH-6 | Alta | Funcional | dev | — | — |
| TC-007 | Token expirado devuelve 401 y limpia sesión | AC-AUTH-7 | Media | Negativo | dev | — | — |
| TC-008 | Catálogo muestra productos | AC-CAT-1 | Alta | Funcional | dev | — | — |
| TC-009 | Paginación del catálogo | AC-CAT-2 | Media | Funcional | dev | — | — |
| TC-010 | Búsqueda por término | AC-CAT-3 | Media | Funcional | dev | — | — |
| TC-011 | Filtro por categoría | AC-CAT-4 | Media | Funcional | dev | — | — |
| TC-012 | Catálogo sin resultados muestra estado vacío | AC-CAT-5 | Baja | Funcional | dev | — | — |
| TC-013 | Producto sin stock se marca correctamente | AC-CAT-6 | Media | Funcional | dev | — | — |
| TC-014 | Detalle muestra info completa | AC-DET-1 | Alta | Funcional | dev | — | — |
| TC-015 | Agregar al carrito actualiza contador | AC-DET-2 | Alta | Funcional | dev | — | — |
| TC-016 | Producto sin stock deshabilita agregar | AC-DET-3 | Media | Negativo | dev | — | — |
| TC-017 | URL de producto inexistente → 404 | AC-DET-4 | Baja | Negativo | dev | — | — |
| TC-018 | Carrito persiste al recargar | AC-CART-1 | Alta | Funcional | dev | — | — |
| TC-019 | Cambiar cantidad recalcula total | AC-CART-2 | Alta | Funcional | dev | — | — |
| TC-020 | Eliminar ítem actualiza total | AC-CART-3 | Alta | Funcional | dev | — | — |
| TC-021 | Carrito vacío muestra estado vacío | AC-CART-4 | Baja | Funcional | dev | — | — |
| TC-022 | No se puede exceder el stock | AC-CART-5 | Media | Negativo | dev | — | — |
| TC-023 | Checkout sin sesión redirige a login | AC-CHK-1 | Alta | Negativo | dev | — | — |
| TC-024 | Checkout crea pedido y confirma | AC-CHK-2 | Alta | Funcional | dev | — | — |
| TC-025 | Checkout vacía el carrito | AC-CHK-3 | Alta | Funcional | dev | — | — |
| TC-026 | Checkout no solicita datos de pago reales | AC-CHK-4 | Alta | Negativo | dev | — | — |
| TC-027 | Pedido refleja ítems, cantidades y total | AC-CHK-5 | Media | Funcional | dev | — | — |
| TC-028 | Cliente sin rol admin no accede al panel | AC-ADM-1 | Alta | Negativo | dev | — | — |
| TC-029 | Admin crea producto visible en catálogo | AC-ADM-2 | Alta | Funcional | dev | — | — |
| TC-030 | Admin edita producto | AC-ADM-3 | Media | Funcional | dev | — | — |
| TC-031 | Admin elimina producto | AC-ADM-4 | Media | Funcional | dev | — | — |
| TC-032 | Admin consulta pedidos | AC-ADM-5 | Media | Funcional | dev | — | — |
| TC-033 | Navbar según estado de sesión | AC-NAV-1 | Media | Funcional | dev | — | — |
| TC-034 | Ruta inexistente → 404 amigable | AC-NAV-2 | Baja | Negativo | dev | — | — |
| TC-035 | Vistas usables en mobile y desktop | AC-NAV-3 | Media | Compatibilidad | dev | — | — |

---

## 6. Datos de prueba necesarios (para pedirle a Backend/PO)

Para ejecutar la matriz, necesitamos un set mínimo de datos de prueba:

- **Usuario cliente** (email/contraseña de prueba).
- **Usuario administrador** (para probar el panel).
- **Productos con stock** (catálogo, detalle, carrito, checkout).
- **Productos sin stock** (casos negativos).
- **Categorías** (para probar filtros).

*Nota para el equipo*: los datos de prueba no se cargan a producción; solo a `dev`.

---

## 7. Próximos pasos sugeridos

1. **Backend** ratifica PostgreSQL y cierra `BCK-001..010` (contratos de endpoints, formato de errores, JWT).
2. **PO / negocio** revisa y ajusta estos AC (o descarta los que no aplican).
3. **Frontend** confirma el mapa de vistas contra estos AC.
4. **QA** transforma cada AC en caso de prueba ejecutable y completa la matriz al ejecutar.
5. Acordar dónde vive la matriz definitiva (Drive > QA, o checklist de la tarjeta).

---

*Documento de propuesta elaborado por QA. Abierto a correcciones de todo el equipo antes de darse por definitivo.*
