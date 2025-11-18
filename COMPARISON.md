# Comparativo Autosafe vs Carseg

## Panorámica
- **Autosafe** y **Carseg** comparten los módulos de constantes, controlador de negocio y mensajes de error; las diferencias reales viven en el User Event de Orden de Trabajo y en un controlador adicional de Carseg para integraciones PX/Telematics.
- Ambos User Events ejecutan la misma lógica de **afterSubmit** (orquestación de coberturas, fulfilment, integraciones) porque comparten el controlador; las variaciones aparecen antes de esa fase (pre-carga y validaciones).

## Resumen rápido de diferencias
| Área | Autosafe | Carseg |
| --- | --- | --- |
| Pre-ensamble desde Suitelet | Procesa `custpage_field_datos_tecnicos`, busca el MantChaser, rellena serie, dispositivo y VID en la OT y muestra mensajes de éxito/advertencia.| No procesa parámetros externos; la OT se carga sin modificaciones automáticas. |
| Botones en **beforeLoad** | Ensamble (alquiler/custodia/garantía) solo si **no** hay serie; "Chequear Orden" también considera flujos de custodia o alquiler. Client script `TS_CS_Ensamble_Dispositivo_PE.js`. | Siempre crea los tres botones de ensamble (vista y edición) y el chequeo depende solo de serie/instalaciones/accesorios. Client script base `TS_CS_Ensamble_Dispositivo.js`. |
| Validación en **beforeSubmit** | No valida estado de dispositivo. | En subsidiaria Ecuador, bloquea guardar si el estado del dispositivo no es compatible con la acción de producto o la entrega directa. |
| Integraciones Hunter | No existe módulo. | Controlador `HU_TS_ScriptPlataformas_controller.js` envía a PX/Telematics y registra resultados. |

## User Event de Orden de Trabajo
### beforeLoad
- **Autosafe**: si el Suitelet envía `custpage_field_datos_tecnicos`, ejecuta `procesarDatosTecnicos` que carga el MantChaser, rellena serie/dispositivo/VID y agrega mensajes contextuales en el formulario.【F:AUTOSAFE/User_event/TS_UE_Orden_Trabajo_PE.js†L39-L364】 Además, muestra u oculta botones según estado y flujos: el chequeo se habilita con serie, instalaciones, accesorios **o** flujos de custodia/alquiler; los botones de ensamble solo aparecen cuando no existe serie asignada y el client script apunta al módulo `_PE`.【F:AUTOSAFE/User_event/TS_UE_Orden_Trabajo_PE.js†L130-L209】
- **Carseg**: carga el formulario sin parámetros externos y evalúa condiciones más simples; el chequeo solo depende de serie/instalaciones/accesorios, siempre crea los tres botones de ensamble (vista y edición) y usa el client script estándar.【F:CARSEG/User_event/TS_UE_Orden_Trabajo.js†L120-L170】

### beforeSubmit
- **Autosafe**: no implementa `beforeSubmit`; el guardado pasa directo a `afterSubmit`.
- **Carseg**: si el usuario pertenece a la subsidiaria Ecuador y edita una OT en `PROCESANDO`, compara la acción de producto (`ADP_ACCION_DEL_PRODUCTO`) y la configuración de entrega directa contra el estado del dispositivo; si la combinación no es válida, lanza un error y bloquea el guardado.【F:CARSEG/User_event/TS_UE_Orden_Trabajo.js†L173-L205】

### afterSubmit
- Ambos User Events comparten la misma lógica (mismo controlador) para: calcular coberturas, gestionar fulfilments y preparar datos para plataformas; no hay diferencias de código en esta sección.【F:AUTOSAFE/User_event/TS_UE_Orden_Trabajo_PE.js†L393-L520】【F:CARSEG/User_event/TS_UE_Orden_Trabajo.js†L215-L520】

## Otros módulos
- **Constantes** (`constant/TS_CM_Constant.js`): archivos idénticos con estados de OT, códigos ADP y parámetros por país (incluye valores para Perú y Ecuador).【F:AUTOSAFE/constant/TS_CM_Constant.js†L1-L122】【F:CARSEG/constant/TS_CM_Constant.js†L1-L122】
- **Controlador base** (`controller/TS_CM_Controller_PE.js` vs `controller/TS_CM_Controller.js`): misma implementación; solo cambia el nombre que importa el User Event.【F:AUTOSAFE/User_event/TS_UE_Orden_Trabajo_PE.js†L33-L37】【F:CARSEG/User_event/TS_UE_Orden_Trabajo.js†L33-L37】
- **Mensajes de error** (`error/TS_CM_ErrorMessages.js`): sin diferencias.【F:AUTOSAFE/error/TS_CM_ErrorMessages.js†L1-L80】【F:CARSEG/error/TS_CM_ErrorMessages.js†L1-L80】

## Integraciones exclusivas de Carseg
- **Cobertura funcional**: el controlador `IntegracionesHunter/HU_TS_ScriptPlataformas_controller.js` implementa más de 15 operaciones hacia PX/Telematics (instalación, desinstalación, reinstalación, renovación, mantenimiento/chequeo, venta de servicios y seguros, cambio o actualización de propietario/estado, registrar canal y reconexión). No existe ningún módulo equivalente en Autosafe.【F:CARSEG/IntegracionesHunter/HU_TS_ScriptPlataformas_controller.js†L1-L205】【F:CARSEG/IntegracionesHunter/HU_TS_ScriptPlataformas_controller.js†L474-L739】
- **Armado de payload y autenticación**: cada envío compone un objeto `PxAdmin` con credenciales (`NetSuite`/`NS*25#01@%j?i`), limpia campos, agrega datos de orden, vehículo, dispositivo, propietario, cobertura, servicios y comandos según la operación, y fija el código de operación PX (`OperacionOrden`) antes de llamar a `sendPXServer`. El método de instalación muestra la estructura típica: obtiene todos los datos de la OT, setea valores segmentados y envía el request.【F:CARSEG/IntegracionesHunter/HU_TS_ScriptPlataformas_controller.js†L51-L108】
- **Registro y control de reintentos**: antes de enviar crea `customrecord_ts_regis_impulso_plataforma` para trazar el envío, marca `custrecord_ht_ot_pxadminfinalizacion` si PX responde `1` y, si no se finaliza, fuerza el estado de la OT a `4` para evitar seguir avanzando sin confirmación. Este patrón se repite en instalación, desinstalación, modificación y reconexión.【F:CARSEG/IntegracionesHunter/HU_TS_ScriptPlataformas_controller.js†L61-L107】【F:CARSEG/IntegracionesHunter/HU_TS_ScriptPlataformas_controller.js†L165-L205】【F:CARSEG/IntegracionesHunter/HU_TS_ScriptPlataformas_controller.js†L430-L472】【F:CARSEG/IntegracionesHunter/HU_TS_ScriptPlataformas_controller.js†L692-L739】
- **Ramas específicas por país**: varias operaciones devuelven directamente el payload cuando la nacionalidad es Perú (para depurar o consumir la respuesta de PX) y, en otras subsidiarias, solo devuelven `true/false`. También ajustan el comportamiento de logging y actualización de registros según la bandera `pxadminfinalizacion`.【F:CARSEG/IntegracionesHunter/HU_TS_ScriptPlataformas_controller.js†L110-L158】【F:CARSEG/IntegracionesHunter/HU_TS_ScriptPlataformas_controller.js†L212-L258】【F:CARSEG/IntegracionesHunter/HU_TS_ScriptPlataformas_controller.js†L330-L340】【F:CARSEG/IntegracionesHunter/HU_TS_ScriptPlataformas_controller.js†L364-L380】

## Diagramas
### Flujo comparado de beforeLoad y beforeSubmit
```mermaid
flowchart TD
    subgraph Autosafe
        A0[beforeLoad] -->|custpage_field_datos_tecnicos?| A1[procesarDatosTecnicos: carga MantChaser y actualiza OT]
        A1 --> A2[Mensajes por estado OS / plataformas]
        A2 --> A3{Estado PROCESANDO/CHEQUEADO?}
        A3 -- Sí --> A4{Serie/instalaciones/accesorios/custodia/alquiler?}
        A4 -- Sí --> A5[Botón Chequear Orden]
        A4 -- No --> A6[Sin chequeo]
        A3 -- Sí --> A7{¿OT sin serie?}
        A7 -- Sí --> A8[Botones ensamble alquiler/custodia/garantía]
        A3 -- No --> A9[Sin botones]
        A9 --> A10[beforeSubmit (no aplica)]
    end
    subgraph Carseg
        B0[beforeLoad] --> B1[Mensajes por estado OS / plataformas]
        B1 --> B2{Estado PROCESANDO/CHEQUEADO?}
        B2 -- Sí --> B3{Serie/instalaciones/accesorios?}
        B3 -- Sí --> B4[Botón Chequear Orden]
        B2 -- Sí --> B5[Botones ensamble alquiler/custodia/garantía]
        B0 --> B6[beforeSubmit: valida acción vs estado dispositivo (solo Ecuador)]
    end
```

### Secuencia de edición de OT (resaltando diferencias)
```mermaid
sequenceDiagram
    participant Suitelet as Suitelet (solo Autosafe)
    participant Usuario
    participant UE_A as UE Autosafe
    participant UE_C as UE Carseg
    participant PX as PX/Telematics (Carseg)

    Suitelet->>UE_A: Carga OT con custpage_field_datos_tecnicos
    UE_A->>UE_A: Busca MantChaser y guarda serie/VID
    UE_A-->>Usuario: Formulario con botones según flujos

    Usuario->>UE_C: Edita OT (estado PROCESANDO)
    UE_C->>UE_C: Valida estado dispositivo vs acción de producto (Ecuador)
    alt Validación falla
        UE_C-->>Usuario: Error y se bloquea guardado
    else
        UE_C-->>Usuario: Formulario con botones estándar
        UE_C->>PX: Orquestación PX/Telematics vía controlador Hunter (solo Carseg)
    end
```
