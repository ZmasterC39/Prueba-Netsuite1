/**
 * @NApiVersion 2.1
 * 
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/https',
    'N/url',
    'N/format',
    'N/file',
    'N/query'
],
    (log, search, record, https, url, format, file, query) => {
        const OPERACION_ORDEN_INSTALACION = "001"; // Instalación
        const OPERACION_ORDEN_DESINSTALACION = "002"; // Desinstalación
        const OPERACION_ORDEN_REINSTALACION = "003"; // Reinstalación
        const OPERACION_ORDEN_RENOVACION = "004"; // Renovación
        const OPERACION_ORDEN_MODIFICACION = "005";
        const OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO = "006";//
        const OPERACION_ORDEN_CHEQUEO_COMPONENTES = "007";
        const OPERACION_ORDEN_VENTA_SEGUROS = "008";//
        const OPERACION_ORDEN_RENOVACION_SEGUROS = "009";
        const OPERACION_ORDEN_CAMBIO_PROPIETARIO = "010";
        const OPERACION_ORDEN_RECONEXION = "011";
        // const OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS = "012";
        const OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS = "013";
        // const OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS = "014";
        const OPERACION_ORDEN_VENTA_SERVICIOS = "015";
        const OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS = "016";
        const OPERACION_ORDEN_ACTUALIZACION_ESTADOS = "017"; //
        const OPERACION_ORDEN_REGISTRAR_CANAL = "018";
        const OPERACION_ORDEN_INSTALACION_COMPONENTES = "019";
        // const TELEMATIC_OPERACION_INSTALACION_NUEVA = "001";
        // const TELEMATIC_OPERACION_DESINSTALACION_DISPOSITIVO = "002";
        // const TELEMATIC_OPERACION_CAMBIO_PROPIETARIO = "003";
        // const TELEMATIC_OPERACION_ACTUALIZACION_DATOS_TECNICOS = "004";
        // const TELEMATIC_OPERACION_ACTUALIZACION_DATOS_CLIENTES = "006";
        // const TELEMATIC_OPERACION_ACTUALIZACION_DATOS_VEHICULOS = "007";
        // const TELEMATIC_OPERACION_ACTUALIZACION_SERVICIOS = "008";
        // const TELEMATIC_OPERACION_ACTUALIZACION_COBERTURAS = "009";
        // const TELEMATIC_OPERACION_CORTE_SIM = "010";
        // const TELEMATIC_OPERACION_RECONEXION = "011";

        const UNIDAD_TIEMPO = {
            ANIO: 1,
            MESES: 2,
            DIA: 3
        }

        const usuario = "NetSuite";
        const clave = "NS*25#01@%j?i";

        const envioPXInstalacionDispositivo = (ordenTrabajoId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, vehiculo, Propietario, PropietarioMonitoreo, Cobertura, pxadminfinalizacion, Aseguradora, Concesionario, Financiera, Convenio, Commands, Servicios, salesOrderId, Location, Ejecutiva } = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            log.debug("pxadminfinalizacion........................", pxadminfinalizacion);
            log.debug("vehiculo........................", vehiculo);
            if (vehiculo && vehiculo != "") {
                if (!pxadminfinalizacion) {
                    let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "PX");
                    let PxAdmin = {};
                    setAuthenticationValues(PxAdmin);
                    setEmptyFields(PxAdmin);
                    log.debug("Servicios........................", Servicios);
                    log.debug("Commands........................", Commands);
                    setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                    PxAdmin["OperacionOrden"] = OPERACION_ORDEN_INSTALACION;
                    PxAdmin["URLPX"] = URLPX;
                    setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_INSTALACION);
                    setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_INSTALACION);
                    setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_INSTALACION);
                    setAseguradoraValues(PxAdmin, Aseguradora, OPERACION_ORDEN_INSTALACION);
                    setConcesionarioValues(PxAdmin, Concesionario, OPERACION_ORDEN_INSTALACION);
                    setFinancieraValues(PxAdmin, Financiera, OPERACION_ORDEN_INSTALACION);
                    setConvenioValues(PxAdmin, Convenio, OPERACION_ORDEN_INSTALACION);
                    setMonitoreoValues(PxAdmin, PropietarioMonitoreo, OPERACION_ORDEN_INSTALACION);
                    setCommandsValues(PxAdmin, Servicios, OPERACION_ORDEN_INSTALACION, Cobertura);
                    //setCoberturaValues(PxAdmin, Cobertura);
                    // PxAdmin["ServiciosInstalados"] = Servicios.join("/");
                    log.debug("Body PX Instalacion Dispositivo", PxAdmin);
                    let response = sendPXServer(PxAdmin);
                    //galvar se comento por pedido de Peru 14-03-2025
                    PxAdmin["Respuesta"] = response.body;
                    log.debug("Response PX Instalacion Dispositivo", response.body);
                    if (response.body == 1) {
                        //TODO: cambiar a false para pruebas, solo para validación
                        let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                        updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                        updatePxadmin.save();
                        pxadminfinalizacion = true;
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "enviado", response.body);
                    } else {
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
                    }
                }
                if (!pxadminfinalizacion) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                    updatePxadmin.save();
                    return false;
                }
                return true;
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXInstalacionDispositivoPeru = (ordenTrabajoId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, vehiculo, Propietario, PropietarioMonitoreo, Cobertura, pxadminfinalizacion, Aseguradora, Concesionario, Financiera, Convenio, Commands, Servicios, salesOrderId, Location, Ejecutiva } = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            log.debug("pxadminfinalizacion........................", pxadminfinalizacion);
            log.debug("vehiculo........................", vehiculo);
            if (vehiculo && vehiculo != "") {
                //if (!pxadminfinalizacion) {
                let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "PX");
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setEmptyFields(PxAdmin);
                log.debug("Servicios........................", Servicios);
                log.debug("Commands........................", Commands);
                setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_INSTALACION;
                PxAdmin["URLPX"] = URLPX;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_INSTALACION);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_INSTALACION);
                setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_INSTALACION);
                setAseguradoraValues(PxAdmin, Aseguradora, OPERACION_ORDEN_INSTALACION);
                setConcesionarioValues(PxAdmin, Concesionario, OPERACION_ORDEN_INSTALACION);
                setFinancieraValues(PxAdmin, Financiera, OPERACION_ORDEN_INSTALACION);
                setConvenioValues(PxAdmin, Convenio, OPERACION_ORDEN_INSTALACION);
                setMonitoreoValues(PxAdmin, PropietarioMonitoreo, OPERACION_ORDEN_INSTALACION);
                setCommandsValues(PxAdmin, Servicios, OPERACION_ORDEN_INSTALACION, Cobertura);
                //setCoberturaValues(PxAdmin, Cobertura);
                // PxAdmin["ServiciosInstalados"] = Servicios.join("/");
                log.debug("Body PX Instalacion Dispositivo", PxAdmin);
                let response = sendPXServer(PxAdmin);
                //galvar se comento por pedido de Peru 14-03-2025
                PxAdmin["Respuesta"] = response.body;
                log.debug("Response PX Instalacion Dispositivo", response.body);
                //galvar se comento por pedido de Peru 14-03-2025
                if (NACIONALIDAD == "PE") {
                    //let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "PX");
                    if (response.body == 1) {
                        pxadminfinalizacion = true;
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "enviado", response.body);
                    } else {
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
                    }
                    return PxAdmin;
                }
                //} 
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXDesinstalacionDispositivo = (ordenTrabajoId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId, Cobertura, Location, Ejecutiva } = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            log.debug("vehiculo........................", vehiculo);
            if (vehiculo && vehiculo != "") {
                if (!pxadminfinalizacion) {
                    let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "PX");
                    let PxAdmin = {};
                    setAuthenticationValues(PxAdmin);
                    setEmptyFields(PxAdmin);
                    // setSalesOrderValues(PxAdmin, salesOrderId);
                    // PxAdmin["OperacionOrden"] = OPERACION_ORDEN_DESINSTALACION;
                    setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                    PxAdmin["OperacionOrden"] = OPERACION_ORDEN_DESINSTALACION;
                    //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                    PxAdmin["URLPX"] = URLPX;
                    //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                    setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_DESINSTALACION);
                    setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_DESINSTALACION);
                    setCommandsValues(PxAdmin, Servicios = "", OPERACION_ORDEN_DESINSTALACION, Cobertura);
                    log.debug("Body PX Desinstalacion Dispositivo", PxAdmin);
                    let response = sendPXServer(PxAdmin);
                    log.debug("response", response);
                    PxAdmin["Respuesta"] = response.body;
                    log.debug("Response PX Desinstalacion Dispositivo", response.body);
                    if (response.body == 1) {
                        let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                        updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                        updatePxadmin.save();
                        pxadminfinalizacion = true;
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "enviado", response.body);
                    } else {
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
                    }
                }
                if (!pxadminfinalizacion) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                    updatePxadmin.save();
                    return false;
                }
                if (NACIONALIDAD == "PE") {
                    return PxAdmin;
                } else {
                    return true;
                }
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXRenovacionDispositivo = (ordenServicioId, subsidiaria, URLPX, familia) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, vehiculo, Propietario,  Cobertura, Location, Ejecutiva, Servicios } = obtenerCamposOrdenServicioNuevo(ordenServicioId, subsidiaria, familia);
            //let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId, Cobertura, Location, Ejecutiva } = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            log.debug("vehiculo........................", vehiculo);
            log.debug("Dispositivo........................", Dispositivo);
            //log.debug("Cobertura........................", Cobertura);
            if (vehiculo && vehiculo != "") {
                //if (!pxadminfinalizacion) {
                if (Dispositivo && Dispositivo != ""   ) {  
                    let PxAdmin = {};
                    setAuthenticationValues(PxAdmin);
                    setEmptyFields(PxAdmin);
                    // setSalesOrderValues(PxAdmin, salesOrderId);
                    // PxAdmin["OperacionOrden"] = OPERACION_ORDEN_DESINSTALACION;
                    setSalesOrderValues(PxAdmin, ordenServicioId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                    PxAdmin["OperacionOrden"] = OPERACION_ORDEN_RENOVACION;
                    //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                    PxAdmin["URLPX"] = URLPX;
                    //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                    setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_RENOVACION);
                    setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_RENOVACION);
                    setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_RENOVACION);       
                    //setCommandsValues(PxAdmin, Servicios = "", OPERACION_ORDEN_RENOVACION, Cobertura);           
                    setCommandsValues(PxAdmin, Servicios, OPERACION_ORDEN_RENOVACION, Cobertura);
                    log.debug("Body PX Renovacion Dispositivo", PxAdmin);
                    let response = sendPXServer(PxAdmin);
                    log.debug("response", response);
                    PxAdmin["Respuesta"] = response.body;
                    log.debug("Response PX Renovacion Dispositivo", response.body);
                    if (response.body == 1) {
                        log.debug("PxAdmin-Reno", PxAdmin);
                        //return true;
                        return {PxAdmin, response};
                    } else {
                    //return false;
                        return {PxAdmin, response};
                    } 
                } else  {
                    log.debug("Data...........................", "No existe Datos para Renovar");
                    return false;       
                }
            } else {
                log.debug("subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXActualizacionDatosPropietario = (ordenServicioId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { vehiculo, Propietario, Location, Ejecutiva } = obtenerCamposOrdenServicio(ordenServicioId, subsidiaria);
            //let Dispositivo="";
            let Cobertura = "";
            //let { Dispositivo, vehiculo, Propietario, pxadminfinalizacion, salesOrderId, Cobertura, Location, Ejecutiva} = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            log.debug("vehiculo........................", vehiculo);
            if (vehiculo && vehiculo != "") {
                //-if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setEmptyFields(PxAdmin);
                //setSalesOrderValues(PxAdmin, salesOrderId);
                vehiculo: ""
                setSalesOrderValues(PxAdmin, ordenServicioId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS;
                //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                PxAdmin["URLPX"] = URLPX;
                //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS);
                //setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS);
                setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS);
                log.debug("Body PX Actualizacion Datos Propietario", PxAdmin);
                let response = sendPXServer(PxAdmin);
                PxAdmin["Respuesta"] = response.body;
                log.debug("Response PX Actualizacion Datos Propietario", response.body);
                if (response.body == 1) {
                    // let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    // updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                    // updatePxadmin.save();
                    //pxadminfinalizacion = true;
                     return {PxAdmin, response};
                } else {
                    return {PxAdmin, response};
                }          
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }

        }

        const envioPXCambioPropietario = (ordenServicioId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { vehiculo, Propietario, PropietarioMonitoreo, NuevoPropietario, Location, Ejecutiva } = obtenerCamposOrdenServicio(ordenServicioId, subsidiaria);
            log.debug("vehiculo........................", vehiculo);
            if (vehiculo && vehiculo != "") {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, ordenServicioId, vehiculo, "", Location, Ejecutiva, NACIONALIDAD);
                //setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_CAMBIO_PROPIETARIO;
                //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                PxAdmin["URLPX"] = URLPX;
                //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_CAMBIO_PROPIETARIO);
                setPropietarioValues(PxAdmin, NuevoPropietario, OPERACION_ORDEN_CAMBIO_PROPIETARIO);
                // setMonitoreoValues(PxAdmin,  PropietarioMonitoreo , OPERACION_ORDEN_CAMBIO_PROPIETARIO);
                if (PropietarioMonitoreo?.PropietarioMonitoreo) {
                    setMonitoreoValues(PxAdmin, PropietarioMonitoreo, OPERACION_ORDEN_CAMBIO_PROPIETARIO);
                } else {
                    setMonitoreoValues(PxAdmin, NuevoPropietario, OPERACION_ORDEN_CAMBIO_PROPIETARIO);
                }
                setCommandsValues(PxAdmin, Servicios = "", OPERACION_ORDEN_CAMBIO_PROPIETARIO, Cobertura = "");
                PxAdmin["OperacionDispositivo"] = "A";
                log.debug("Body PX Cambio Propietario", PxAdmin);
                let response = sendPXServer(PxAdmin);
                PxAdmin["Respuesta"] = response.body;
                log.debug("Response PX Cambio Propietario", response.body);
                if (NACIONALIDAD == "PE") {
                    return PxAdmin;
                } else {
                    return true;
                }
                //return PxAdmin;
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXMantenimientoChequeoDispositivo = (ordenTrabajoId, subsidiaria, URLPX, activofijoId) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, vehiculo, Cobertura, salesOrderId, Location, Ejecutiva } = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            log.debug("vehiculo........................", vehiculo);
            if (vehiculo && vehiculo != "") {
                let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, activofijoId, "enviado", "PX");
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setEmptyFields(PxAdmin);
                setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO;
                //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                PxAdmin["URLPX"] = URLPX;
                //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO);
                setCommandsValues(PxAdmin, Servicios = "", OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO, Cobertura);
                //setCoberturaValues(PxAdmin, Cobertura);
                log.debug("Body PX Mantenimiento Chequeo Dispositivo", PxAdmin);
                let response = sendPXServer(PxAdmin);
                PxAdmin["Respuesta"] = response.body;
                log.debug("Response PX Mantenimiento Chequeo Dispositivo", response.body);
                if (NACIONALIDAD == "PE") {
                    return PxAdmin;
                }
                else {
                    if (response.body == 1) {
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "enviado", response.body);
                        return true;
                    } else {
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
                        return false;
                    }
                }
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXActualizacionEstado = (dispositivoId, subsidiaria, URLPX, vehiculoId, respuesta, estadocobertura, familia) => {
            try {
                let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
                let Dispositivo = obtenerDispositivo(dispositivoId, subsidiaria);
                let vehiculo = obtenerVehiculo(vehiculoId);
                let Servicios = "";
                let Cobertura = "";
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setEmptyFields(PxAdmin);
                Dispositivo.producto = familia;
                log.debug("............Dispositivo...................", Dispositivo);
                PxAdmin["NumeroOrden"] = '0';
                PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                PxAdmin["URLPX"] = URLPX;
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_ACTUALIZACION_ESTADOS;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_ACTUALIZACION_ESTADOS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_ACTUALIZACION_ESTADOS);
                setCommandsValues(PxAdmin, Servicios, OPERACION_ORDEN_ACTUALIZACION_ESTADOS, Cobertura);
                const fecha = new Date();
                const formato = fecha.getFullYear().toString() + String(fecha.getMonth() + 1).padStart(2, '0') + String(fecha.getDate()).padStart(2, '0');
                PxAdmin["UsuarioIngreso"] = "OPERAD" + "_" + NACIONALIDAD;
                PxAdmin["FileName"] = vehiculoId + "_" + formato;
                //-PxAdmin["EstadoSim"] = estado;
                if (respuesta == "1") {
                    PxAdmin["EstadoSim"] = estadocobertura;
                }
                //--PxAdmin["EstadoSim"] = estadoSim;
                log.debug("Body PX Actualizacion Estado", PxAdmin);
                let response = sendPXServer(PxAdmin);
                PxAdmin["Respuesta"] = response.body;
                log.debug("Response PX Actualizacion Estado", response.body);
                if (respuesta == "1") {
                    return { PxAdmin, response };
                } else {
                    return true;
                    //return PxAdmin;
                }
            } catch (error) {
                log.debug('error-envioPXActualizacionEstado', error.stack);
            }
        }

        const envioPXModificacionDispositivo = (ordenTrabajoId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId, Location, Ejecutiva } = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            log.debug("vehiculo........................", vehiculo);
            if (vehiculo && vehiculo != "") {
                if (!pxadminfinalizacion) {
                    let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "PX");
                    let PxAdmin = {};
                    setAuthenticationValues(PxAdmin);
                    setEmptyFields(PxAdmin);
                    //setSalesOrderValues(PxAdmin, salesOrderId);
                    setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                    PxAdmin["OperacionOrden"] = OPERACION_ORDEN_MODIFICACION;
                    // PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                    PxAdmin["URLPX"] = URLPX;
                    //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                    setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_MODIFICACION);
                    setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_MODIFICACION);
                    setCommandsValues(PxAdmin, Servicios = "", OPERACION_ORDEN_MODIFICACION, Cobertura = "");
                    //setCoberturaValues(PxAdmin, Cobertura);
                    log.debug("Body PX Modificacion Dispositivo", PxAdmin);
                    let response = sendPXServer(PxAdmin);
                    PxAdmin["Respuesta"] = response.body;
                    log.debug("Response PX Modificacion Dispositivo", response.body);
                    if (response.body == 1) {
                        let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                        updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                        updatePxadmin.save();
                        pxadminfinalizacion = true;
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "enviado", response.body);
                    // return {PxAdmin, response};
                    } else  {
                        //return {PxAdmin, response};
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
                    }
                }
                if (!pxadminfinalizacion) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                    updatePxadmin.save();
                    return false;
                }
                return true;
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXRegistrarCanal = (vehioculoId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let Cobertura = "";
            //let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId, Cobertura,  Location, Ejecutiva } = obtenerCamposOrdenTrabajo(ordenTrabajoId);
            let { vehiculo, Propietario, Aseguradora, Concesionario, Financiera, Convenio } = obtenerCamposVehiculo(vehioculoId)
            if (vehiculo && vehiculo != "") {
                // if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setEmptyFields(PxAdmin);
                //setSalesOrderValues(PxAdmin, salesOrderId);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_REGISTRAR_CANAL;
                PxAdmin["NumeroOrden"] = '0';
                PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                PxAdmin["URLPX"] = URLPX;
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_REGISTRAR_CANAL;
                const fecha = new Date();
                const formato = fecha.getFullYear().toString() + String(fecha.getMonth() + 1).padStart(2, '0') + String(fecha.getDate()).padStart(2, '0');
                PxAdmin["UsuarioIngreso"] = "OPERAD" + "_" + NACIONALIDAD;
                PxAdmin["FileName"] = vehioculoId + "_" + formato;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_REGISTRAR_CANAL);
                setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_REGISTRAR_CANAL);
                setAseguradoraValues(PxAdmin, Aseguradora, OPERACION_ORDEN_REGISTRAR_CANAL);
                setConcesionarioValues(PxAdmin, Concesionario, OPERACION_ORDEN_REGISTRAR_CANAL);
                setFinancieraValues(PxAdmin, Financiera, OPERACION_ORDEN_REGISTRAR_CANAL);
                setConvenioValues(PxAdmin, Convenio, OPERACION_ORDEN_REGISTRAR_CANAL);
                setCommandsValues(PxAdmin, Servicios = "", OPERACION_ORDEN_REGISTRAR_CANAL, Cobertura = "");
                //setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_ACTUALIZACION_ESTADOS);
                log.debug("Body PX Registrar Canal", PxAdmin);
                let response = sendPXServer(PxAdmin);
                PxAdmin["Respuesta"] = response.body;
                log.debug("Body PX Registrar Canal", PxAdmin);
                if (response.body == 1) {
                    return {PxAdmin, response};
                } else  {
                    return {PxAdmin, response};
                }
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXChequeoComponentes = (ordenTrabajoId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, Propietario, vehiculo, Cobertura, pxadminfinalizacion, Servicios, salesOrderId,  Location, Ejecutiva } = obtenerCamposOrdenComponente(ordenTrabajoId, subsidiaria);
            log.debug("vehiculo........................", vehiculo);
            if (vehiculo && vehiculo != "") { 
                if (!pxadminfinalizacion) {
                    let PxAdmin = {};
                    setAuthenticationValues(PxAdmin);
                    setEmptyFields(PxAdmin);
                    //setSalesOrderValues(PxAdmin, salesOrderId);
                    setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                    PxAdmin["OperacionOrden"] = OPERACION_ORDEN_CHEQUEO_COMPONENTES;
                    //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                    PxAdmin["URLPX"] = URLPX;
                    //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                    setPropietarioValues(PxAdmin, Propietario, OPERACION_ORDEN_CHEQUEO_COMPONENTES);
                    setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_CHEQUEO_COMPONENTES);
                    setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_CHEQUEO_COMPONENTES);
                    setCommandsValues(PxAdmin, Servicios, OPERACION_ORDEN_CHEQUEO_COMPONENTES, Cobertura);
                    //setCoberturaValues(PxAdmin, Cobertura);
                    log.debug("Body PX Chequeo Componentes", PxAdmin);
                    let response = sendPXServer(PxAdmin);
                    PxAdmin["Respuesta"]=response.body;
                    log.debug("Response PX Chequeo Componentes", response.body);
                    if (response.body == 1) {
                        let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                        updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                        updatePxadmin.save();
                        pxadminfinalizacion = true;
                    } else {
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
                    }
                }
                if (!pxadminfinalizacion) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                    updatePxadmin.save();
                    return false;
                }
                return true;
                //return PxAdmin;            
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }
        
        const envioPXVentaSeguros = (ordenServicioId, subsidiaria, URLPX, familia) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            // let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId, Cobertura,  Location, Ejecutiva  } = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            //let { vehiculo, Propietario,  Location, Ejecutiva } = obtenerCamposOrdenServicio(ordenServicioId, subsidiaria);          
            let { Dispositivo, vehiculo, Cobertura, Location, Ejecutiva } = obtenerCamposOrdenServicioNuevo(ordenServicioId, subsidiaria, familia);
            Dispositivo = "";
            if (vehiculo && vehiculo != "") {
                //if (!pxadminfinalizacion) {
                let PxAdmin = {};
                setAuthenticationValues(PxAdmin);
                setEmptyFields(PxAdmin);
                //setSalesOrderValues(PxAdmin, salesOrderId);
                setSalesOrderValues(PxAdmin, ordenServicioId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                PxAdmin["OperacionOrden"] = OPERACION_ORDEN_VENTA_SEGUROS;
                //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                PxAdmin["URLPX"] = URLPX;
                //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_VENTA_SEGUROS);
                setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_VENTA_SEGUROS);
                setCommandsValues(PxAdmin, Servicios = "", OPERACION_ORDEN_VENTA_SEGUROS, Cobertura);
                //setCoberturaValues(PxAdmin, Cobertura);
                log.debug("Body PX Venta Seguros", PxAdmin);
                let response = sendPXServer(PxAdmin);
                PxAdmin["Respuesta"] = response.body;
                log.debug("Response PX Venta Seguros", response.body);
                if (response.body == 1) {
                    return {PxAdmin, response};
                } else  {
                    return {PxAdmin, response};
                }
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXReinstalacionDispositivo = (ordenTrabajoId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId, Location, Ejecutiva } = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            log.debug("vehiculo........................", vehiculo);
            if (vehiculo && vehiculo != "") {
                if (!pxadminfinalizacion) {
                    let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "PX");
                    let PxAdmin = {};
                    setAuthenticationValues(PxAdmin);
                    setEmptyFields(PxAdmin);
                    //setSalesOrderValues(PxAdmin, salesOrderId);
                    setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                    PxAdmin["OperacionOrden"] = OPERACION_ORDEN_REINSTALACION;
                    //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                    PxAdmin["URLPX"] = URLPX;
                    // PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                    setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_REINSTALACION);
                    setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_REINSTALACION);
                    setCommandsValues(PxAdmin, Servicios = "", OPERACION_ORDEN_REINSTALACION, Cobertura = "");
                    //setCoberturaValues(PxAdmin, Cobertura);
                    log.debug("Body PX Reinstalacion Dispositivo", PxAdmin);
                    let response = sendPXServer(PxAdmin);
                    PxAdmin["Respuesta"] = response.body;
                    log.debug("Response PX Reinstalacion Dispositivo", response.body);
                    if (response.body == 1) {
                        //return {PxAdmin, response};
                        let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                        updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                        updatePxadmin.save();
                        pxadminfinalizacion = true;
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "enviado", response.body);
                    } else  {
                        //return {PxAdmin, response};
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
                    }
                }
                if (!pxadminfinalizacion) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                    updatePxadmin.save();
                    return false;
                }
                return true;
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXInstalacionComponentes = (ordenTrabajoId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId,  Location, Ejecutiva } = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            log.debug("vehiculo........................", vehiculo);       
            if (vehiculo && vehiculo != "") { 
                if (!pxadminfinalizacion) {
                    let PxAdmin = {};
                    setAuthenticationValues(PxAdmin);
                    setEmptyFields(PxAdmin);
                    //setSalesOrderValues(PxAdmin, salesOrderId);
                    setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                    PxAdmin["OperacionOrden"] = OPERACION_ORDEN_INSTALACION_COMPONENTES;
                    //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                    PxAdmin["URLPX"] = URLPX;
                    //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                    setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_INSTALACION_COMPONENTES);
                    setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_INSTALACION_COMPONENTES);                   
                    setCommandsValues(PxAdmin, Servicios="", OPERACION_ORDEN_INSTALACION_COMPONENTES, Cobertura="");
                    //setCoberturaValues(PxAdmin, Cobertura);
                    log.debug("Body PX Instalacion Componentes", PxAdmin);
                    let response = sendPXServer(PxAdmin);
                    PxAdmin["Respuesta"]=response.body;
                    log.debug("Response PX Instalacion Componentes", response.body);
                    if (response.body == 1) {
                        let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                        updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                        updatePxadmin.save();
                        pxadminfinalizacion = true;
                    }
                }
                if (!pxadminfinalizacion) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                    updatePxadmin.save();
                    return false;
                }
                return true;
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }       
        }
      
        const envioPXInstalacionReconexion = (ordenTrabajoId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, vehiculo, pxadminfinalizacion, salesOrderId, Cobertura, Location, Ejecutiva } = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            log.debug("vehiculo........................", vehiculo);
            if (vehiculo && vehiculo != "") {
                if (!pxadminfinalizacion) {
                    let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "PX");
                    let PxAdmin = {};
                    setAuthenticationValues(PxAdmin);
                    setEmptyFields(PxAdmin);
                    //setSalesOrderValues(PxAdmin, salesOrderId);
                    setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                    PxAdmin["OperacionOrden"] = OPERACION_ORDEN_RECONEXION;
                    //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                    PxAdmin["URLPX"] = URLPX;
                    //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                    setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_RECONEXION);
                    setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_RECONEXION);
                    setCommandsValues(PxAdmin, Servicios = "", OPERACION_ORDEN_RECONEXION, Cobertura);
                    //log.error("PxAdmin", PxAdmin);
                    log.debug("Body PX Instalacion Otros Productos", PxAdmin);
                    let response = sendPXServer(PxAdmin);
                    PxAdmin["Respuesta"] = response.body;
                    log.debug("Response PX Instalacion Otros Productos", response.body);
                    if (response.body == 1) {
                        //return {PxAdmin, response};
                        let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                        updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                        updatePxadmin.save();
                        pxadminfinalizacion = true;
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "enviado", response.body);
                    } else  {
                        //return {PxAdmin, response};
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
                    }
                }
                if (!pxadminfinalizacion) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                    updatePxadmin.save();
                    return false;
                }
                return true;
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXVentaServicios = (ordenTrabajoId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId, Location, Servicios, Ejecutiva } = obtenerCamposOrdenTrabajoDisp(ordenTrabajoId, subsidiaria);
            // log.error("vehiculo........................", vehiculo);    
            log.debug("Servicios........................", Servicios);
            // log.error("Dispositivo........................", Dispositivo);  
            // log.error("Cobertura........................", Cobertura);                                
            if (vehiculo && vehiculo != "") {
                if (!pxadminfinalizacion) {
                    let PxAdmin = {};
                    let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "PX");
                    setAuthenticationValues(PxAdmin);
                    setEmptyFields(PxAdmin);
                    //setSalesOrderValues(PxAdmin, salesOrderId);
                    setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                    PxAdmin["OperacionOrden"] = OPERACION_ORDEN_VENTA_SERVICIOS;
                    //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                    PxAdmin["URLPX"] = URLPX;
                    //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                    setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_VENTA_SERVICIOS);
                    setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_VENTA_SERVICIOS);
                    if (Servicios !== undefined) {
                        setCommandsValues(PxAdmin, Servicios, OPERACION_ORDEN_INSTALACION, Cobertura);
                    } else {
                        setCommandsValues(PxAdmin, Servicios = "", OPERACION_ORDEN_VENTA_SERVICIOS, Cobertura);
                    }
                    //setCoberturaValues(PxAdmin, Cobertura);
                    log.debug("Body PX Venta Servicios", PxAdmin);
                    let response = sendPXServer(PxAdmin);
                    log.debug("Response PX Venta Servicios", response.body);
                    PxAdmin["Respuesta"] = response.body;
                    if (response.body == 1) {
                        //return {PxAdmin, response};
                        let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                        updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                        updatePxadmin.save();
                        pxadminfinalizacion = true;
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "enviado", response.body);
                    } else  {
                        //return {PxAdmin, response};
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
                    }
                }
                if (!pxadminfinalizacion) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                    updatePxadmin.save();
                    return false;
                }
                return true;
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXRenovacionSeguro = (ordenServicioId, subsidiaria, URLPX, familia) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, vehiculo, Cobertura, Location, Ejecutiva } = obtenerCamposOrdenServicioNuevo(ordenServicioId, subsidiaria, familia);
            //let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId, Location, Ejecutiva} = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            log.debug("vehiculo........................", vehiculo);
            if (vehiculo && vehiculo != "") {
                if (!pxadminfinalizacion) {
                    let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "PX");
                    let PxAdmin = {};
                    setAuthenticationValues(PxAdmin);
                    setEmptyFields(PxAdmin);
                    //setSalesOrderValues(PxAdmin, salesOrderId);
                    setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                    PxAdmin["OperacionOrden"] = OPERACION_ORDEN_RENOVACION_SEGUROS;
                    //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                    PxAdmin["URLPX"] = URLPX;
                    //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                    setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_RENOVACION_SEGUROS);
                    setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_RENOVACION_SEGUROS);
                    setCommandsValues(PxAdmin, Servicios = "", OPERACION_ORDEN_RENOVACION_SEGUROS, Cobertura);
                    //setCoberturaValues(PxAdmin, Cobertura);
                    log.debug("Body PX Renovacion Seguro", PxAdmin);
                    let response = sendPXServer(PxAdmin);
                    PxAdmin["Respuesta"] = response.body;
                    log.debug("Response PX Renovacion Seguro", response.body);
                    if (response.body == 1) {
                        //return {PxAdmin, response};
                        let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                        updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                        updatePxadmin.save();
                        pxadminfinalizacion = true;
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "enviado", response.body);
                    } else  {
                        //return {PxAdmin, response};
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
                    }
                }
                if (!pxadminfinalizacion) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                    updatePxadmin.save();
                    return false;
                }
                return true;
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const envioPXChequeoOtrosProductos = (ordenTrabajoId, subsidiaria, URLPX) => {
            let NACIONALIDAD = obtenerNacionalidad(subsidiaria);
            let { Dispositivo, vehiculo, Cobertura, pxadminfinalizacion, salesOrderId, Location, Ejecutiva } = obtenerCamposOrdenTrabajo(ordenTrabajoId, subsidiaria);
            log.debug("vehiculo........................", vehiculo);
            if (vehiculo && vehiculo != "") {
                if (!pxadminfinalizacion) {
                    let registroImpulsoPlataforma = crearRegistroImpulsoPlataforma(ordenTrabajoId, null, "enviado", "PX");
                    let PxAdmin = {};
                    setAuthenticationValues(PxAdmin);
                    setEmptyFields(PxAdmin);
                    //setSalesOrderValues(PxAdmin, salesOrderId);
                    setSalesOrderValues(PxAdmin, salesOrderId, vehiculo, Cobertura, Location, Ejecutiva, NACIONALIDAD);
                    PxAdmin["OperacionOrden"] = OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS;
                    //PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
                    PxAdmin["URLPX"] = URLPX;
                    //PxAdmin["UsuarioIngreso"] ="OPERAD"+ "_"+NACIONALIDAD;
                    setVehiculoValues(PxAdmin, vehiculo, OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS);
                    setDispositivoValues(PxAdmin, Dispositivo, OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS);
                    setCommandsValues(PxAdmin, Servicios = "", OPERACION_ORDEN_RENOVACION_SEGUROS, Cobertura);
                    //setCoberturaValues(PxAdmin, Cobertura);
                    log.debug("Body PX Chequeo Otros Productos", PxAdmin);
                    let response = sendPXServer(PxAdmin);
                    PxAdmin["Respuesta"] = response.body;
                    log.debug("Response PX Chequeo Otros Productos", response.body);
                    if (response.body == 1) {
                        //return {PxAdmin, response};
                        let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                        updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_pxadminfinalizacion', value: true })
                        updatePxadmin.save();
                        pxadminfinalizacion = true;
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "enviado", response.body);
                    } else  {
                        //return {PxAdmin, response};
                        actualizarRegistroImpulsoPlataforma(registroImpulsoPlataforma, "error", response.body);
                    }
                }
                if (!pxadminfinalizacion) {
                    let updatePxadmin = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
                    updatePxadmin.setValue({ fieldId: 'custrecord_ht_ot_estado', value: 4 })
                    updatePxadmin.save();
                    return false;
                }
                return true;
            } else {
                log.debug("..subsidiaria...........................", "No existe en la Subsidiaria");
                return false;
            }
        }

        const consultaCobertura = (IdVehiculo, idfamilia, subsidiaria) => {
            let coberturaSearchResult = search.create({
                type: "customrecord_ht_co_cobertura",
                filters: [
                    ["custrecord_ht_co_bien", "anyof", IdVehiculo],          
                    "AND",
                    ["custrecord_ht_co_familia_prod", "anyof", idfamilia],
                    "AND",
                    ["custrecord_ht_co_subsidiaria", "anyof", subsidiaria]                 
                ],
                columns: [
                    search.createColumn({ name: "name", sort: search.Sort.ASC, label: "ID" }),
                    search.createColumn({ name: "internalid" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custrecord_ht_co_coberturainicial}, 'YYYY-MM-DD')", label: "Formula (Text)" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custrecord_ht_co_coberturafinal}, 'YYYY-MM-DD')", label: "Formula (Text)" }),
                    search.createColumn({ name: "custrecord_ht_co_coberturainicial" }),
                    search.createColumn({ name: "custrecord_ht_co_coberturafinal" }),
                    search.createColumn({ name: "custrecord_ht_co_clientemonitoreo" }),
                    search.createColumn({ name: "custrecord_ht_co_bien" }),
                    search.createColumn({ name: "custrecord_ht_co_producto" }),
                    search.createColumn({ name: "custrecord_ht_co_estado_cobertura", label: "HT CO Estado Cobertura" }),
                    search.createColumn({ name: "custrecord_ht_co_numeroserieproducto" }),
                    search.createColumn({ name: "custrecord_ht_co_plazo" }),
                    search.createColumn({ name: "custrecord_ht_co_numerodispositivo" }),
                    search.createColumn({ name: "custrecord_ht_co_propietario" }), 
                    search.createColumn({ name: "custrecord_ht_co_subsidiaria" })   
                ]
            }).run().getRange(0, 10);
           // log.debug('coberturaSearchResult', coberturaSearchResult);
            let result = {
                id: "",
                clientemonitoreo: "",
                bien: "",
                producto: "",
                numeroserieproducto: "",
                plazo: "",
                estado_cobertura: "",
                numerodispositivo: "",
                clientepropietario: "",
                subsidiaria: "",
                custrecord_ht_co_coberturainicialtext: "",
                custrecord_ht_co_coberturafinaltext: "",
                custrecord_ht_co_coberturainicial:  "",
                custrecord_ht_co_coberturafinal:  ""
            };    
            if (!coberturaSearchResult.length) return result;
            let columns = coberturaSearchResult[0].columns;    
            log.debug("coberturaSearchResult........................", coberturaSearchResult[0]);
            return {
                id: coberturaSearchResult[0].getValue("internalid"),
                clientemonitoreo: coberturaSearchResult[0].getValue("custrecord_ht_co_clientemonitoreo"),
                bien: coberturaSearchResult[0].getValue("custrecord_ht_co_bien"),
                producto: coberturaSearchResult[0].getValue("custrecord_ht_co_producto"),
                numeroserieproducto: coberturaSearchResult[0].getValue("custrecord_ht_co_numeroserieproducto"),
                plazo: coberturaSearchResult[0].getValue("custrecord_ht_co_plazo"),
                estado_cobertura: coberturaSearchResult[0].getText("custrecord_ht_co_estado_cobertura"),
                numerodispositivo: coberturaSearchResult[0].getValue("custrecord_ht_co_numerodispositivo"),
                clientepropietario: coberturaSearchResult[0].getText("custrecord_ht_co_propietario"),
                subsidiaria:coberturaSearchResult[0].getValue("custrecord_ht_co_subsidiaria"),
                custrecord_ht_co_coberturainicialtext: coberturaSearchResult[0].getValue(columns[2]),
                custrecord_ht_co_coberturafinaltext: coberturaSearchResult[0].getValue(columns[3]),
                custrecord_ht_co_coberturainicial: format.parse({ value: coberturaSearchResult[0].getValue(columns[4]), type: format.Type.DATE }),
                custrecord_ht_co_coberturafinal: format.parse({ value: coberturaSearchResult[0].getValue(columns[5]), type: format.Type.DATE })           
            };
        }

        const obtenerCamposOrdenServicio = (ordenServicioId, subsidiaria) => {
            let ordenVenta = record.load({ type: record.Type.SALES_ORDER, id: ordenServicioId });
            if (ordenVenta.getValue('subsidiary') != String(subsidiaria)) {
                return { vehiculo: "", Propietario: "", PropietarioMonitoreo: "", NuevoPropietario: "", Location: "", Ejecutiva: "" };
            }
            log.debug('ordenVenta...............', ordenVenta);
            let Propietario = obtenerPropietario(ordenVenta.getValue('entity'));
            let PropietarioMonitoreo = obtenerPropietarioMonitoreo(ordenVenta, null);
            let vehiculo = obtenerVehiculo(ordenVenta.getValue('custbody_ht_so_bien'), subsidiaria);
            log.debug('vehiculo.............................', vehiculo);
            let order = record.load({ type: 'salesorder', id: ordenServicioId });
            log.debug('order...............', order);
            let clienteNew = order.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: 0 });
            let NuevoPropietario = obtenerNewPropietario(clienteNew, subsidiaria);
            //obtenerNuevoPropietario(ordenVenta, null);
            let sql6 = 'SELECT firstname, lastname, subsidiary FROM employee WHERE id = ? and  subsidiary = ? '
            let resultSet6 = query.runSuiteQL({ query: sql6, params: [ordenVenta.getValue('custbody_ht_os_ejecutivareferencia'), subsidiaria] });
            let results6 = resultSet6.asMappedResults();
            if (results6.length > 0) {
                Ejecutiva = results6[0]['firstname'] + ' ' + results6[0]['lastname'];
            } else {
                Ejecutiva = "";
            }
            log.debug('RESULTTTTT......................', results6);
            //
            let sql5 = 'SELECT Location.name, Location.subsidiary FROM Location JOIN locationSubsidiaryMap ON location.id = locationSubsidiaryMap.location JOIN Subsidiary ON locationSubsidiaryMap.subsidiary = Subsidiary.id WHERE  location.id = ? and Subsidiary.id = ? '
            let resultSet5 = query.runSuiteQL({ query: sql5, params: [ordenVenta.getValue('location'), subsidiaria] });
            let results5 = resultSet5.asMappedResults();
            if (results5.length > 0) {
                Location = results5[0]['name'];
            } else {
                Location = "";
            }
            log.debug('RESULTTTTT......................', results5);
            return { vehiculo, Propietario, PropietarioMonitoreo, NuevoPropietario, Location, Ejecutiva };
        }

        const obtenerCamposOrdenServicioNuevo = (ordenServicioId, subsidiaria, familia) => {
            let ordenVenta = record.load({ type: record.Type.SALES_ORDER, id: ordenServicioId });
            if (ordenVenta.getValue('subsidiary') != String(subsidiaria)) {
                return { vehiculo: "", Propietario: "", PropietarioMonitoreo: "", NuevoPropietario: "", Location: "", Ejecutiva: "" };
            }
            log.debug('ordenVenta...............', ordenVenta);
            let Propietario = obtenerPropietario(ordenVenta.getValue('entity'));
            let PropietarioMonitoreo = obtenerPropietarioMonitoreo(ordenVenta, null);
            let vehiculo = obtenerVehiculo(ordenVenta.getValue('custbody_ht_so_bien'), subsidiaria);
            log.debug('vehiculo.............................', vehiculo);
            let familiaConsulta = obtenerFamilia(familia, subsidiaria)
            log.debug('familiaConsulta...............', familiaConsulta);
            let Cobertura = consultaCobertura(ordenVenta.getValue('custbody_ht_so_bien'), familiaConsulta.id, subsidiaria);
            log.debug('Cobertura...............', Cobertura);
            let Servicios = getVehiculoServiciosGeneral(ordenVenta.getValue('custbody_ht_so_bien'),  subsidiaria);
            log.debug('Commands..................', Servicios)
            //let Dispositivo = obtenerInformacionDispositivo(coberturaConsulta.numeroserieproducto);
            let Dispositivo = obtenerDispositivo(Cobertura.numeroserieproducto, subsidiaria);
            // log.debug('Dispositivo...............', Dispositivo);
            let order = record.load({ type: 'salesorder', id: ordenServicioId });
            log.debug('order...............', order);
            let clienteNew = order.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente', line: 0 });
            //let NuevoPropietario = obtenerNewPropietario(clienteNew);
            //obtenerNuevoPropietario(ordenVenta, null);
            let sql6 = 'SELECT firstname, lastname, subsidiary FROM employee WHERE id = ? and  subsidiary = ? '
            let resultSet6 = query.runSuiteQL({ query: sql6, params: [ordenVenta.getValue('custbody_ht_os_ejecutivareferencia'), subsidiaria] });
            let results6 = resultSet6.asMappedResults();
            if (results6.length > 0) {
                Ejecutiva = results6[0]['firstname'] + ' ' + results6[0]['lastname'];
            } else {
                Ejecutiva = "";
            }
            log.debug('RESULTTTTT......................', results6);
            //
            let sql5 = 'SELECT Location.name, Location.subsidiary FROM Location JOIN locationSubsidiaryMap ON location.id = locationSubsidiaryMap.location JOIN Subsidiary ON locationSubsidiaryMap.subsidiary = Subsidiary.id WHERE  location.id = ? and Subsidiary.id = ? '
            let resultSet5 = query.runSuiteQL({ query: sql5, params: [ordenVenta.getValue('location'), subsidiaria] });
            let results5 = resultSet5.asMappedResults();
            if (results5.length > 0) {
                Location = results5[0]['name'];
            } else {
                Location = "";
            }
            log.debug('RESULTTTTT......................', results5);
            return { Dispositivo, vehiculo, Propietario, PropietarioMonitoreo, Cobertura, Location, Ejecutiva, Servicios };
        }

        const obtenerCamposOrdenTrabajo = (ordenTrabajoId, subsidiaria) => {
            let Convenio = {};
            var Location = "";
            var Ejecutiva = "";
            let ordenTrabajo = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
            if (ordenTrabajo.getValue('custrecord_ht_ot_subsidiary') != String(subsidiaria)) {
                return { Dispositivo: "", vehiculo: "", Propietario: "", PropietarioMonitoreo: "", Cobertura: "", Subsidiaria: "", Aseguradora: "", Concesionario: "", Financiera: "", Convenio: "", Commands: "", Servicios: "", pxadminfinalizacion: "", confirmaciontelamatic: "", salesOrderId: "", numPuertas: "", Location: "", Ejecutiva: "" };
            }
            log.debug('ordenTrabajo......................', ordenTrabajo);
            let numPuertas = ordenTrabajo.getValue('custrecord_ht_ot_numero_puertas');
            let salesOrderId = ordenTrabajo.getValue('custrecord_ht_ot_orden_servicio');
            let ordenVenta = record.load({ type: record.Type.SALES_ORDER, id: salesOrderId });
            if (ordenVenta.getValue('subsidiary') != String(subsidiaria)) {
                return { Dispositivo: "", vehiculo: "", Propietario: "", PropietarioMonitoreo: "", Cobertura: "", Subsidiaria: "", Aseguradora: "", Concesionario: "", Financiera: "", Convenio: "", Commands: "", Servicios: "", pxadminfinalizacion: "", confirmaciontelamatic: "", salesOrderId: "", numPuertas: "", Location: "", Ejecutiva: "" };
            }
            log.debug('ordenVenta...............', ordenVenta);
            //
            let sql5 = 'SELECT Location.name, Location.subsidiary FROM Location JOIN locationSubsidiaryMap ON location.id = locationSubsidiaryMap.location JOIN Subsidiary ON locationSubsidiaryMap.subsidiary = Subsidiary.id WHERE  location.id = ? and Subsidiary.id = ? '
            let resultSet5 = query.runSuiteQL({ query: sql5, params: [ordenVenta.getValue('location'), subsidiaria] });
            let results5 = resultSet5.asMappedResults();
            if (results5.length > 0) {
                Location = results5[0]['name'];
            } else {
                Location = "";
            }
            log.debug('Location......................', results5);
            let sql6 = 'SELECT firstname, lastname, subsidiary FROM employee WHERE id = ? and  subsidiary = ? '
            let resultSet6 = query.runSuiteQL({ query: sql6, params: [ordenVenta.getValue('custbody_ht_os_ejecutivareferencia'), subsidiaria] });
            let results6 = resultSet6.asMappedResults();
            if (results6.length > 0) {
                Ejecutiva = results6[0]['firstname'] + ' ' + results6[0]['lastname'];
            } else {
                Ejecutiva = "";
            }
            log.debug('employee......................', results6);
            //let bien = ordenVenta.getValue('custbody_ht_so_bien');
            let sql4 = 'SELECT custrecord_ht_bien_conveniovehiculo FROM customrecord_ht_record_bienes WHERE id = ? and custrecord_bn_subsidiaria = ? '
            let resultSet4 = query.runSuiteQL({ query: sql4, params: [ordenVenta.getValue('custbody_ht_so_bien'), subsidiaria] });
            let results4 = resultSet4.asMappedResults();
            log.debug('customrecord_ht_record_bienes', results4);
            let periodoCobertura = obtenerPeriodoCobertura(ordenVenta);
            log.debug('periodoCobertura..................', periodoCobertura);
            let fechaChequeo = ordenTrabajo.getValue('custrecord_ht_ot_fechatrabajoasignacion');
            log.debug('fechaChequeo.length', fechaChequeo);
            if (!fechaChequeo) {
                log.debug('Campo Fecha', 'Vacío')
                fechaChequeo = getFechaChequeo();
                log.debug('dateChequeo', fechaChequeo);
            }
            let fechaCoberturaOrden = getCobertura(periodoCobertura, UNIDAD_TIEMPO.MESES, fechaChequeo);//*GENERAR COBERTURA PARA EL REGISTRO DE COBERTURA ========================
            log.debug('COBERTURA ========================', fechaCoberturaOrden)
            log.debug('custrecord_ht_ot_serieproductoasignacion..................', ordenTrabajo.getValue('custrecord_ht_ot_serieproductoasignacion'));
            let Dispositivo = []
            Dispositivo = obtenerDispositivo(ordenTrabajo.getValue('custrecord_ht_ot_serieproductoasignacion'), subsidiaria);
            log.debug('Dispositivo..................', Dispositivo);
            log.debug('ordenTrabajo.getText..................', ordenTrabajo.getText('custrecord_ht_ot_producto'));
            if (Dispositivo !== undefined) {
                Dispositivo.producto = ordenTrabajo.getText('custrecord_ht_ot_producto') || "";
            }
            //log.debug('Dispositivo.producto..................', Dispositivo.producto );           
            let vehiculo = obtenerVehiculo(ordenTrabajo.getValue('custrecord_ht_ot_vehiculo'), subsidiaria);
            log.debug('vehiculo.............................', vehiculo);
            let productCadena = ordenTrabajo.getText('custrecord_ht_ot_producto')
            if (productCadena.includes("-")) {
                productCadena = productCadena.split('-')[1]/*.replace(/\s+/g, '')*/
            }
            //log.debug('EstadoBien', vehiculo.getValue('custrecord_ht_bn_estadobien'));
            //log.debug('EstadoBien', vehiculo);
            //vehiculo.EstadoCartera = vehiculo.getValue('custrecord_ht_bn_estadobien');
            vehiculo.producto = productCadena || "";
            vehiculo.fechaInicioCobertura = ordenVenta.getValue('trandate');
            vehiculo.fechaFinCobertura = new Date(vehiculo.fechaInicioCobertura.getFullYear(), vehiculo.fechaInicioCobertura.getMonth() + periodoCobertura, vehiculo.fechaInicioCobertura.getDate());
            let Propietario = obtenerPropietario(ordenTrabajo.getValue('custrecord_ht_ot_cliente_id'));
            let PropietarioMonitoreo = obtenerPropietarioMonitoreo(ordenVenta, ordenTrabajo.getValue('custrecord_ht_ot_item'));
            let Cobertura = obtenerCobertura(ordenTrabajo, subsidiaria);
            log.debug("Cobertura........................", Cobertura);
            Cobertura.custrecord_ht_co_coberturainicial = Cobertura?.custrecord_ht_co_coberturainicial ? Cobertura.custrecord_ht_co_coberturainicial : fechaCoberturaOrden?.coberturaInicial;
            Cobertura.custrecord_ht_co_coberturafinal = Cobertura?.custrecord_ht_co_coberturafinal ? Cobertura.custrecord_ht_co_coberturafinal : fechaCoberturaOrden?.coberturaFinal;
            Cobertura.custrecord_ht_co_coberturainicialtext = Cobertura?.custrecord_ht_co_coberturainicialtext ? Cobertura.custrecord_ht_co_coberturainicialtext : fechaCoberturaOrden?.coberturaInicial;
            Cobertura.custrecord_ht_co_coberturafinaltext = Cobertura?.custrecord_ht_co_coberturafinaltext ? Cobertura.custrecord_ht_co_coberturafinaltext : fechaCoberturaOrden?.coberturaFinal;
            log.debug("Cobertura............2............", Cobertura);
            let pxadminfinalizacion = ordenTrabajo.getValue('custrecord_ht_ot_pxadminfinalizacion');
            let confirmaciontelamatic = ordenTrabajo.getValue('custrecord_ht_ot_confirmaciontelamatic');
            let Subsidiaria = obtenerSubsidiaria(ordenVenta.getValue('subsidiary'));
            log.debug("Subsidiaria........................", Subsidiaria);
            //log.error("pxadminfinalizacion........................", pxadminfinalizacion);
            let Aseguradora = obtenerCanalDistribucion(ordenVenta.getValue('custbody_ht_os_companiaseguros'), subsidiaria);
            log.debug('Aseguradora........................', Aseguradora);
            let Concesionario = obtenerCanalDistribucion(ordenVenta.getValue('custbody_ht_os_concesionario'), subsidiaria);
            log.debug('Concesionario........................', Concesionario);
            let Financiera = obtenerCanalDistribucion(ordenVenta.getValue('custbody_ht_os_bancofinanciera'), subsidiaria);
            log.debug('Financiera........................', Financiera)
            if (results4.length > 0) {
                Convenio = obtenerConvenio(results4[0]['custrecord_ht_bien_conveniovehiculo']);
            } else {
                Convenio = obtenerConvenio(ordenVenta.getValue('custbody_ht_os_convenio'));
            }
            //let Commands = obtenerCommands(ordenTrabajo, ordenVenta);
            //log.debug('salesOrderId........................', salesOrderId)
            let Commands = getVehiculoServicios(ordenTrabajo.getValue('custrecord_ht_ot_vehiculo'), salesOrderId, subsidiaria);
            //log.debug('Commands.........11.........', Commands)
            let Servicios = ordenTrabajo.getText("custrecord_ht_ot_servicios_commands");
            //let Producto = ordenTrabajo.getText('custrecord_ht_ot_producto');
            // log.debug('CONVENIOOOO', Convenio)
            //log.debug('Subsidiaria', Subsidiaria)
            log.debug('Servicios..................', Servicios)
            // log.debug('PROPIETARIOMON', PropietarioMonitoreo)
            return { Dispositivo, vehiculo, Propietario, PropietarioMonitoreo, Cobertura, Subsidiaria, Aseguradora, Concesionario, Financiera, Convenio, Commands, Servicios, pxadminfinalizacion, confirmaciontelamatic, salesOrderId, numPuertas, Location, Ejecutiva };
        }

          const obtenerCamposOrdenComponente= (ordenTrabajoId, subsidiaria) => {
            let Convenio = {};
            var Location="";
            var Ejecutiva="";           
            let ordenTrabajo = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
            if (ordenTrabajo.getValue('custrecord_ht_ot_subsidiary') != String(subsidiaria)){
                return { Dispositivo:"", vehiculo:"", Propietario:"", PropietarioMonitoreo:"", Cobertura:"", Subsidiaria:"", Aseguradora:"", Concesionario:"", Financiera:"", Convenio:"", Commands:"", Servicios:"", pxadminfinalizacion:"", confirmaciontelamatic:"", salesOrderId:"", numPuertas:"", Location:"", Ejecutiva:""};
            }
            log.debug('ordenTrabajo......................', ordenTrabajo);
            let numPuertas = ordenTrabajo.getValue('custrecord_ht_ot_numero_puertas');
            let salesOrderId = ordenTrabajo.getValue('custrecord_ht_ot_orden_servicio');
            let ordenVenta = record.load({ type: record.Type.SALES_ORDER, id: salesOrderId });           
            if (ordenVenta.getValue('subsidiary') != String(subsidiaria)){
                return { Dispositivo:"", vehiculo:"", Propietario:"", PropietarioMonitoreo:"", Cobertura:"", Subsidiaria:"", Aseguradora:"", Concesionario:"", Financiera:"", Convenio:"", Commands:"", Servicios:"", pxadminfinalizacion:"", confirmaciontelamatic:"", salesOrderId:"", numPuertas:"", Location:"", Ejecutiva:""};
            }
            log.debug('ordenVenta...............', ordenVenta); 
            //
            let sql5 = 'SELECT Location.name, Location.subsidiary FROM Location JOIN locationSubsidiaryMap ON location.id = locationSubsidiaryMap.location JOIN Subsidiary ON locationSubsidiaryMap.subsidiary = Subsidiary.id WHERE  location.id = ? and Subsidiary.id = ? '
            let resultSet5 = query.runSuiteQL({ query: sql5, params: [ordenVenta.getValue('location'), subsidiaria] });
            let results5 = resultSet5.asMappedResults();
            if (results5.length > 0) {
                Location = results5[0]['name'];
            } else {
                Location = "";
            }
            log.debug('Location......................', results5); 
            let sql6 = 'SELECT firstname, lastname, subsidiary FROM employee WHERE id = ? and  subsidiary = ? '
            let resultSet6 = query.runSuiteQL({ query: sql6, params: [ordenVenta.getValue('custbody_ht_os_ejecutivareferencia'), subsidiaria ] });
            let results6 = resultSet6.asMappedResults();
            if (results6.length > 0) {
                Ejecutiva = results6[0]['firstname'] + ' ' + results6[0]['lastname'] ;
            } else {
                Ejecutiva = "";
            }
            log.debug('employee......................', results6);
            //let bien = ordenVenta.getValue('custbody_ht_so_bien');
            let sql4 = 'SELECT custrecord_ht_bien_conveniovehiculo FROM customrecord_ht_record_bienes WHERE id = ? and custrecord_bn_subsidiaria = ? '
            let resultSet4 = query.runSuiteQL({ query: sql4, params: [ordenVenta.getValue('custbody_ht_so_bien'), subsidiaria] });
            let results4 = resultSet4.asMappedResults();
            log.debug('customrecord_ht_record_bienes', results4);
            let periodoCobertura = obtenerPeriodoCobertura(ordenVenta);
            log.debug('periodoCobertura..................', periodoCobertura);       
            let fechaChequeo = ordenTrabajo.getValue('custrecord_ht_ot_fechatrabajoasignacion');
            log.debug('fechaChequeo.length', fechaChequeo);
            if (!fechaChequeo) {
                log.debug('Campo Fecha', 'Vacío')
                fechaChequeo = getFechaChequeo();
                log.debug('dateChequeo', fechaChequeo);
            }
            let fechaCoberturaOrden = getCobertura(periodoCobertura, UNIDAD_TIEMPO.MESES, fechaChequeo);//*GENERAR COBERTURA PARA EL REGISTRO DE COBERTURA ========================
            log.debug('COBERTURA ========================', fechaCoberturaOrden)
            log.debug('custrecord_ht_ot_serieproductoasignacion..................', ordenTrabajo.getValue('custrecord_ht_ot_serieproductoasignacion'));
            let Dispositivo =[]
            Dispositivo = obtenerDispositivo(ordenTrabajo.getValue('custrecord_ht_ot_serieproductoasignacion'), subsidiaria);
            log.debug('Dispositivo..................', Dispositivo);
            log.debug('ordenTrabajo.getText..................', ordenTrabajo.getText('custrecord_ht_ot_producto'));
            if (  Dispositivo !== undefined) {
                Dispositivo.producto = ordenTrabajo.getText('custrecord_ht_ot_producto') || "";
            }
           //log.debug('Dispositivo.producto..................', Dispositivo.producto );
            //verificar
            let familia = ordenTrabajo.getText('custrecord_ht_ot_producto').split(' - ');
            log.debug('familia...............', familia);
            let idfamilia = familia.length ? familia[0] : '';
            let familiaConsulta = obtenerFamilia(idfamilia, subsidiaria)
            log.debug('familiaConsulta...............', familiaConsulta);
            let CoberturaExiste = obtenerCoberturaDisp(ordenTrabajo.getValue('custrecord_ht_ot_vehiculo'), familiaConsulta.id, subsidiaria);
            log.debug('CoberturaExiste...............', CoberturaExiste);
            //fin
            let vehiculo = obtenerVehiculo(ordenTrabajo.getValue('custrecord_ht_ot_vehiculo'), subsidiaria);
            log.debug('vehiculo.............................', vehiculo);
            let productCadena = ordenTrabajo.getText('custrecord_ht_ot_producto')
            if (productCadena.includes("-")) {
                productCadena = productCadena.split('-')[1]/*.replace(/\s+/g, '')*/
            }          
            //log.debug('EstadoBien', vehiculo.getValue('custrecord_ht_bn_estadobien'));
            //log.debug('EstadoBien', vehiculo);
            //vehiculo.EstadoCartera = vehiculo.getValue('custrecord_ht_bn_estadobien');        
            vehiculo.producto = productCadena || "";
            vehiculo.fechaInicioCobertura = ordenVenta.getValue('trandate');
            vehiculo.fechaFinCobertura = new Date(vehiculo.fechaInicioCobertura.getFullYear(), vehiculo.fechaInicioCobertura.getMonth() + periodoCobertura, vehiculo.fechaInicioCobertura.getDate());   
            let Propietario = obtenerPropietario(ordenTrabajo.getValue('custrecord_ht_ot_cliente_id'));
            let PropietarioMonitoreo = obtenerPropietarioMonitoreo(ordenVenta, ordenTrabajo.getValue('custrecord_ht_ot_item'));
            //let Cobertura = obtenerCobertura(ordenTrabajo, subsidiaria);
            let Cobertura = obtenerCoberturaDisp(ordenTrabajo.getValue('custrecord_ht_ot_vehiculo'), familiaConsulta.id, subsidiaria);           
            log.debug("Cobertura........................", Cobertura);
            Cobertura.custrecord_ht_co_coberturainicial  = Cobertura?.custrecord_ht_co_coberturainicial ? Cobertura.custrecord_ht_co_coberturainicial : fechaCoberturaOrden?.coberturaInicial;
            Cobertura.custrecord_ht_co_coberturafinal  = Cobertura?.custrecord_ht_co_coberturafinal ? Cobertura.custrecord_ht_co_coberturafinal : fechaCoberturaOrden?.coberturaFinal;
            Cobertura.custrecord_ht_co_coberturainicialtext  = Cobertura?.custrecord_ht_co_coberturainicialtext ? Cobertura.custrecord_ht_co_coberturainicialtext : fechaCoberturaOrden?.coberturaInicial;
            Cobertura.custrecord_ht_co_coberturafinaltext  = Cobertura?.custrecord_ht_co_coberturafinaltext ? Cobertura.custrecord_ht_co_coberturafinaltext : fechaCoberturaOrden?.coberturaFinal;  
            log.debug("Cobertura............2............", Cobertura);
            let pxadminfinalizacion = ordenTrabajo.getValue('custrecord_ht_ot_pxadminfinalizacion');
            let confirmaciontelamatic = ordenTrabajo.getValue('custrecord_ht_ot_confirmaciontelamatic');
            let Subsidiaria = obtenerSubsidiaria(ordenVenta.getValue('subsidiary'));
            log.debug("Subsidiaria........................", Subsidiaria);   
            //log.error("pxadminfinalizacion........................", pxadminfinalizacion);  
            let Aseguradora = obtenerCanalDistribucion(ordenVenta.getValue('custbody_ht_os_companiaseguros'), subsidiaria);
            log.debug('Aseguradora........................', Aseguradora);
            let Concesionario = obtenerCanalDistribucion(ordenVenta.getValue('custbody_ht_os_concesionario'), subsidiaria);
            log.debug('Concesionario........................', Concesionario);
            let Financiera = obtenerCanalDistribucion(ordenVenta.getValue('custbody_ht_os_bancofinanciera'), subsidiaria);
            log.debug('Financiera........................', Financiera)
            if (results4.length > 0) {
                Convenio = obtenerConvenio(results4[0]['custrecord_ht_bien_conveniovehiculo']);
            } else {
                Convenio = obtenerConvenio(ordenVenta.getValue('custbody_ht_os_convenio'));
            }
            //let Commands = obtenerCommands(ordenTrabajo, ordenVenta);
            //log.debug('salesOrderId........................', salesOrderId)
            let Commands = getVehiculoServicios(ordenTrabajo.getValue('custrecord_ht_ot_vehiculo'), salesOrderId, subsidiaria);
            //log.debug('Commands.........11.........', Commands)
            let Servicios = ordenTrabajo.getText("custrecord_ht_ot_servicios_commands");
            //let Producto = ordenTrabajo.getText('custrecord_ht_ot_producto');
            // log.debug('CONVENIOOOO', Convenio)
             //log.debug('Subsidiaria', Subsidiaria)
            log.debug('Servicios..................', Servicios)
            // log.debug('PROPIETARIOMON', PropietarioMonitoreo)
            return { Dispositivo, vehiculo, Propietario, PropietarioMonitoreo, Cobertura, Subsidiaria, Aseguradora, Concesionario, Financiera, Convenio, Commands, Servicios, pxadminfinalizacion, confirmaciontelamatic, salesOrderId, numPuertas, Location, Ejecutiva};
        }

        
        const obtenerCamposOrdenTrabajoDisp = (ordenTrabajoId, subsidiaria) => {
            let Convenio = {};
            var Location = "";
            var Ejecutiva = "";
            let ordenTrabajo = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: ordenTrabajoId });
            if (ordenTrabajo.getValue('custrecord_ht_ot_subsidiary') != String(subsidiaria)) {
                return { Dispositivo: "", vehiculo: "", Propietario: "", PropietarioMonitoreo: "", Cobertura: "", Subsidiaria: "", Aseguradora: "", Concesionario: "", Financiera: "", Convenio: "", Commands: "", Servicios: "", pxadminfinalizacion: "", confirmaciontelamatic: "", salesOrderId: "", numPuertas: "", Location: "", Ejecutiva: "" };
            }
            log.debug('ordenTrabajo......................', ordenTrabajo);
            let numPuertas = ordenTrabajo.getValue('custrecord_ht_ot_numero_puertas');
            let salesOrderId = ordenTrabajo.getValue('custrecord_ht_ot_orden_servicio');
            let ordenVenta = record.load({ type: record.Type.SALES_ORDER, id: salesOrderId });
            if (ordenVenta.getValue('subsidiary') != String(subsidiaria)) {
                return { Dispositivo: "", vehiculo: "", Propietario: "", PropietarioMonitoreo: "", Cobertura: "", Subsidiaria: "", Aseguradora: "", Concesionario: "", Financiera: "", Convenio: "", Commands: "", Servicios: "", pxadminfinalizacion: "", confirmaciontelamatic: "", salesOrderId: "", numPuertas: "", Location: "", Ejecutiva: "" };
            }
            log.debug('ordenVenta...............', ordenVenta);
            let sql5 = 'SELECT Location.name, Location.subsidiary FROM Location JOIN locationSubsidiaryMap ON location.id = locationSubsidiaryMap.location JOIN Subsidiary ON locationSubsidiaryMap.subsidiary = Subsidiary.id WHERE  location.id = ? and Subsidiary.id = ? '
            let resultSet5 = query.runSuiteQL({ query: sql5, params: [ordenVenta.getValue('location'), subsidiaria] });
            let results5 = resultSet5.asMappedResults();
            if (results5.length > 0) {
                Location = results5[0]['name'];
            } else {
                Location = "";
            }
            log.debug('Location......................', results5);
            let sql6 = 'SELECT firstname, lastname, subsidiary FROM employee WHERE id = ? and  subsidiary = ? '
            let resultSet6 = query.runSuiteQL({ query: sql6, params: [ordenVenta.getValue('custbody_ht_os_ejecutivareferencia'), subsidiaria] });
            let results6 = resultSet6.asMappedResults();
            if (results6.length > 0) {
                Ejecutiva = results6[0]['firstname'] + ' ' + results6[0]['lastname'];
            } else {
                Ejecutiva = "";
            }
            log.debug('employee......................', results6);
            //let bien = ordenVenta.getValue('custbody_ht_so_bien');
            let sql4 = 'SELECT custrecord_ht_bien_conveniovehiculo FROM customrecord_ht_record_bienes WHERE id = ? and custrecord_bn_subsidiaria = ? '
            let resultSet4 = query.runSuiteQL({ query: sql4, params: [ordenVenta.getValue('custbody_ht_so_bien'), subsidiaria] });
            let results4 = resultSet4.asMappedResults();
            log.debug('customrecord_ht_record_bienes', results4);
            let periodoCobertura = obtenerPeriodoCobertura(ordenVenta);
            log.debug('periodoCobertura..................', periodoCobertura);
            log.debug('custrecord_ht_ot_serieproductoasignacion..................', ordenTrabajo.getValue('custrecord_ht_ot_serieproductoasignacion'));
            let Dispositivo = []
            Dispositivo = obtenerDispositivo(ordenTrabajo.getValue('custrecord_ht_ot_serieproductoasignacion'), subsidiaria);
            log.debug('Dispositivo..................', typeof (Dispositivo));
            log.debug('ordenTrabajo.getText..................', ordenTrabajo.getText('custrecord_ht_ot_producto'));
            let Cobertura = []
            if (Dispositivo !== undefined) {
                log.debug('..aqui..........1......', '..aqui...........1.....');
                Dispositivo.producto = ordenTrabajo.getText('custrecord_ht_ot_producto') || "";
                Cobertura = obtenerCobertura(ordenTrabajo, subsidiaria);
                log.debug("Cobertura........................", Cobertura);
            } else {
                // log.debug('..aqui................', '..aqui................');
                let familia = ordenTrabajo.getText('custrecord_ht_ot_producto').split(' - ');
                log.debug('familia...............', familia);
                let idfamilia = familia.length ? familia[0] : '';
                let familiaConsulta = obtenerFamilia(idfamilia, subsidiaria)
                log.debug('familiaConsulta...............', familiaConsulta);
                // ConsultaCobertura = consultaCobertura(ordenVenta.getValue('custbody_ht_so_bien'), familiaConsulta.id);
                // log.debug('Cobertura...............', ConsultaCobertura);
                // log.debug('Cobertura.....2..........', ConsultaCobertura.numeroserieproducto);
                Cobertura = obtenerCoberturaDisp(ordenVenta.getValue('custbody_ht_so_bien'), familiaConsulta.id, subsidiaria);
                log.debug('Cobertura...............', Cobertura);
                //log.debug('Cobertura.....1..........', Cobertura.numeroserieproducto);
                Dispositivo = obtenerDispositivo(Cobertura.numeroserieproducto, subsidiaria);
                //Dispositivo.producto = ordenTrabajo.getText('custrecord_ht_ot_producto') || "";
                log.debug('datosTecnicos...............', Dispositivo);
            }
            //log.debug('Dispositivo.producto..................', Dispositivo.producto );
            let vehiculo = obtenerVehiculo(ordenTrabajo.getValue('custrecord_ht_ot_vehiculo'), subsidiaria);
            log.debug('vehiculo.............................', vehiculo);
            let productCadena = ordenTrabajo.getText('custrecord_ht_ot_producto')
            if (productCadena.includes("-")) {
                productCadena = productCadena.split('-')[1]/*.replace(/\s+/g, '')*/
            }
            //log.debug('EstadoBien', vehiculo.getValue('custrecord_ht_bn_estadobien'));
            //log.debug('EstadoBien', vehiculo);
            //vehiculo.EstadoCartera = vehiculo.getValue('custrecord_ht_bn_estadobien');
            vehiculo.producto = productCadena || "";
            vehiculo.fechaInicioCobertura = ordenVenta.getValue('trandate');
            vehiculo.fechaFinCobertura = new Date(vehiculo.fechaInicioCobertura.getFullYear(), vehiculo.fechaInicioCobertura.getMonth() + periodoCobertura, vehiculo.fechaInicioCobertura.getDate());
            let Propietario = obtenerPropietario(ordenTrabajo.getValue('custrecord_ht_ot_cliente_id'));
            let PropietarioMonitoreo = obtenerPropietarioMonitoreo(ordenVenta, ordenTrabajo.getValue('custrecord_ht_ot_item'));
            let pxadminfinalizacion = ordenTrabajo.getValue('custrecord_ht_ot_pxadminfinalizacion');
            let confirmaciontelamatic = ordenTrabajo.getValue('custrecord_ht_ot_confirmaciontelamatic');
            let Subsidiaria = obtenerSubsidiaria(ordenVenta.getValue('subsidiary'));
            log.debug("Subsidiaria........................", Subsidiaria);
            //log.error("pxadminfinalizacion........................", pxadminfinalizacion);
            let Aseguradora = obtenerCanalDistribucion(ordenVenta.getValue('custbody_ht_os_companiaseguros'), subsidiaria);
            log.debug('Aseguradora........................', Aseguradora)
            let Concesionario = obtenerCanalDistribucion(ordenVenta.getValue('custbody_ht_os_concesionario'), subsidiaria);
            log.debug('Concesionario........................', Concesionario)
            let Financiera = obtenerCanalDistribucion(ordenVenta.getValue('custbody_ht_os_bancofinanciera'), subsidiaria);
            log.debug('Financiera........................', Financiera)
            if (results4.length > 0) {
                Convenio = obtenerConvenio(results4[0]['custrecord_ht_bien_conveniovehiculo']);
            } else {
                Convenio = obtenerConvenio(ordenVenta.getValue('custbody_ht_os_convenio'));
            }
            //let Commands = obtenerCommands(ordenTrabajo, ordenVenta);
            log.debug('salesOrderId........................', salesOrderId)
            let Commands = getVehiculoServicios(ordenTrabajo.getValue('custrecord_ht_ot_vehiculo'), salesOrderId, subsidiaria);
            log.debug('Commands.........11.........', Commands)
            let Servicios = ordenTrabajo.getText("custrecord_ht_ot_servicios_commands");
            //let Producto = ordenTrabajo.getText('custrecord_ht_ot_producto');
            // log.debug('CONVENIOOOO', Convenio)
            //log.debug('Subsidiaria', Subsidiaria)
            log.debug('Servicios..........11........', Servicios)
            // log.debug('PROPIETARIOMON', PropietarioMonitoreo)
            return { Dispositivo, vehiculo, Propietario, PropietarioMonitoreo, Cobertura, Subsidiaria, Aseguradora, Concesionario, Financiera, Convenio, Commands, Servicios, pxadminfinalizacion, confirmaciontelamatic, salesOrderId, numPuertas, Location, Ejecutiva };
        }

        const obtenerCamposVehiculo = (vehiculoId, subsidiaria) => {
            try {
                // Dispositivo.producto = ordenTrabajo.getText('custrecord_ht_ot_producto') || "";
                let vehiculo = obtenerVehiculo(vehiculoId, subsidiaria);
                log.debug('vehiculo.............................', vehiculo);
                let valorPropietario = vehiculo["custrecord_ht_bien_propietario"] || "";
                //log.debug('Propietario........1................', valorPropietario)
                let valorAseguradora = vehiculo["custrecord_ht_bien_companiaseguros"] || "";
                //log.debug('Aseguradora........1................', valorAseguradora)
                let valorFinanciera = vehiculo["custrecord_ht_bien_financiadovehiculo"] || "";
                //log.debug('Financiera........1................', valorFinanciera)
                let valorConcesionaria = vehiculo["custrecord_ht_bien_consesionarios"] || "";
                //log.debug('Concesionaria........1................', valorConcesionaria)
                let valorConvenio = vehiculo["custrecord_ht_bien_conveniovehiculo"] || "";
                //log.debug('Convenio........1................', valorConvenio)
                let Propietario = obtenerPropietario(valorPropietario[0].value);
                log.debug('Propietario........................', Propietario)
                let Aseguradora = obtenerCanalDistribucion(valorAseguradora[0].value, subsidiaria);
                log.debug('Aseguradora........................', Aseguradora)
                let Concesionario = obtenerCanalDistribucion(valorConcesionaria[0].value, subsidiaria);
                log.debug('Concesionario........................', Concesionario)
                let Financiera = obtenerCanalDistribucion(valorFinanciera[0].value, subsidiaria);
                log.debug('Financiera........................', Financiera)
                let Convenio = valorConvenio.length ? obtenerConvenio(valorConvenio[0].value) : '';
                log.debug('Convenio........................', Convenio)
                return { vehiculo, Propietario, Aseguradora, Concesionario, Financiera, Convenio };
            } catch (error) {
                log.debug("Error...", error.stack);
                return [];
            }
        }

        const obtenerNewPropietario = (id, subsidiaria) => {
            if (!id) return;
            let result = {};
            let correoEmail = '';
            let celular = '';
            let convencional = '';
            let city = '';
            let sql = 'SELECT custrecord_ht_email_email as email FROM customrecord_ht_record_correoelectronico WHERE custrecord_ht_email_tipoemail = 1 AND custrecord_ht_ce_enlace = ?';
            let resultSet = query.runSuiteQL({ query: sql, params: [id] });
            let results = resultSet.asMappedResults();
            correoEmail = results.length ? results[0]['email'] : correoEmail;
            let sql2 = 'SELECT custrecord_ht_campo_txt_telefono as celular FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 1 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
            let resultSet2 = query.runSuiteQL({ query: sql2, params: [id] });
            let results2 = resultSet2.asMappedResults();
            celular = results2.length ? results2[0]['celular'].replace('+593', '0') : celular;
            let sql3 = 'SELECT custrecord_ht_campo_txt_telefono as convencional FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 10 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
            let resultSet3 = query.runSuiteQL({ query: sql3, params: [id] });
            let results3 = resultSet3.asMappedResults();
            convencional = results3.length ? results3[0]['convencional'].replace('+593', '0') : convencional;
            let sql4 = 'SELECT addressbookaddress FROM customeraddressbook WHERE entity = ?'
            let resultSet4 = query.runSuiteQL({ query: sql4, params: [id] });
            let results4 = resultSet4.asMappedResults();
            if (results4.length > 0) {
                let sql5 = 'SELECT addr1, addr2, city, zip, country FROM customerAddressbookEntityAddress WHERE nkey = ?'
                let resultSet5 = query.runSuiteQL({ query: sql5, params: [results4[0]['addressbookaddress']] });
                let results5 = resultSet5.asMappedResults();
                if (results5.length > 0) {
                    city = (results5[0]['addr1'] == null ? '' : results5[0]['addr1']) + ' ' + (results5[0]['addr2'] == null ? '' : results5[0]['addr2']) + ' ' + (results5[0]['city'] == null ? '' : results5[0]['city']) + ' ' + (results5[0]['zip'] == null ? '' : results5[0]['zip']) + ' ' + (results5[0]['country'] == null ? '' : results5[0]['country'])
                }
            }
            let Propietario = search.lookupFields({
                type: 'customer', id: id,
                columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                    'custentity_ht_cl_apellidopaterno',
                    'custentity_ht_cl_apellidomaterno',
                    'phone',
                    'homephone',
                    'email',
                    'vatregnumber',
                    'custentity_ht_customer_id_telematic',
                    'internalid',
                    'custentityts_ec_cod_tipo_doc_identidad',
                    'companyname',
                    'isperson'
                ]
            });
            //let provincia = ObtenerProvincia(id);
            result.htEmail = obtenerCorreosPropietario(id, subsidiaria);
            result.entityid = Propietario.entityid.length ? Propietario.entityid : '';
            // result.phone = Propietario.phone.length ? Propietario.phone.replace('+593', '') : '';
            //result.email = Propietario.email.length ? Propietario.email : '';
            try {   // Log Eliminar 21/08/2024
                let generalCorreos = obtenerCorreosPropietario(id, subsidiaria);
                log.debug('generalCorreos', generalCorreos);
            } catch (error) {
                log.debug('error Integracion', error);
            }
            result.phone = celular;
            result.email = correoEmail;
            // result.email = generalCorreos?.pxEmail ? generalCorreos?.pxEmail : correoEmail;  // Doas 21/08/2025          
            result.vatregnumber = Propietario.vatregnumber.length ? Propietario.vatregnumber : '';
            result.custentity_ht_customer_id_telematic = Propietario.custentity_ht_customer_id_telematic.length ? Propietario.custentity_ht_customer_id_telematic : '';
            result.internalid = Propietario.internalid.length ? Propietario.internalid : '';
            result.isperson = Propietario.isperson;
            // result.provincia = provincia.length ? provincia : '';
            result.provincia = city;
            result.companyname = Propietario.companyname || ""
            result.custentityts_ec_cod_tipo_doc_identidad = Propietario.custentityts_ec_cod_tipo_doc_identidad || "";
            // result.homephone = Propietario.homephone;
            result.homephone = convencional;
            if (result.isperson) {
                result.custentity_ht_cl_primernombre = Propietario.custentity_ht_cl_primernombre.length ? Propietario.custentity_ht_cl_primernombre : '';
                result.custentity_ht_cl_segundonombre = Propietario.custentity_ht_cl_segundonombre.length ? Propietario.custentity_ht_cl_segundonombre : '';
                result.custentity_ht_cl_apellidopaterno = Propietario.custentity_ht_cl_apellidopaterno.length ? Propietario.custentity_ht_cl_apellidopaterno : '';
                result.custentity_ht_cl_apellidomaterno = Propietario.custentity_ht_cl_apellidomaterno.length ? Propietario.custentity_ht_cl_apellidomaterno : '';
            } else {
                result.custentity_ht_cl_primernombre = Propietario.companyname;
            }
            log.debug('result', result)
            return result;
        }

        const obtenerPeriodoCobertura = (ordenServicio) => {
            let cantidad = 0;
            let itemLines = ordenServicio.getLineCount('item');
            for (let j = 0; j < itemLines; j++) {
                let items = ordenServicio.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                let itemtype = ordenServicio.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: j });
                if (itemtype == 'Service') {
                    let quantity = parseInt(ordenServicio.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_tiempo_cobertura', line: j }));
                    let unidadTiempo = ordenServicio.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_und_tiempo_cobertura', line: j });
                    var itemMeses = idItemType(items);
                    // log.debug("quantity", quantity);
                    // log.debug("itemMeses", itemMeses);
                    // log.debug("unidadTiempo", unidadTiempo);
                    // log.debug('TIMES====', itemMeses + ' == ' + 1 + ' && ' + quantity + ' != ' + 0 + ' && ' + unidadTiempo.length + ' > ' + 0)        
                    cantidad = cantidad + quantity;
                }
            }
            return cantidad;
        }

        const getCobertura = (cantidad, undTiempo, fechaChequeo) => {
            log.debug('TIEMPOSSS', `${parseInt(cantidad)} -  ${undTiempo} - ${fechaChequeo}`);
            let date = new Date(fechaChequeo);
            date.setDate(date.getDate());
            let dateChequeo = convertFechaFinalToCobertura(fechaChequeo)
            let date_final = new Date(dateChequeo);
            try {
                if (undTiempo == UNIDAD_TIEMPO.ANIO) {
                    cantidad = parseInt(cantidad) * 12
                    date_final.setDate(date_final.getDate());
                    date_final.setMonth(date_final.getMonth() + parseInt(cantidad));
                } else if (undTiempo == UNIDAD_TIEMPO.DIA) {
                    date_final.setDate(date_final.getDate() + parseInt(cantidad));
                } else {
                    date_final.setDate(date_final.getDate());
                    date_final.setMonth(date_final.getMonth() + parseInt(cantidad));
                }
                date_final = new Date(date_final);
                let horaChequeo = getHoraChequeo()
                date_final.setHours(date_final.getHours() + Number(horaChequeo.split(":")[0]));
                let fechaAjustada = date_final.toISOString();
                //date.setHours(date.getHours() + Number(horaChequeo.split(":")[0]));
                date.setHours(date.getHours());
                date = date.toISOString()
                return {
                    // coberturaInicial: date,
                    // coberturaFinal: fechaAjustada
                    coberturaInicial: date.split("T")[0],
                    coberturaFinal: fechaAjustada.split("T")[0]
                };
            } catch (e) {
                log.debug(e);
            }
        }

        const convertFechaFinalToCobertura = (fechaPST) => {
            let fechaOriginal = new Date(fechaPST);
            let año = fechaOriginal.getFullYear();
            let mes = String(fechaOriginal.getMonth() + 1).padStart(2, '0'); // Obtiene el mes (0-11), así que se suma 1 y se formatea
            let dia = String(fechaOriginal.getDate()).padStart(2, '0'); // Obtiene el día
            let fechaFormateada = `${año}-${mes}-${dia}`;
            return fechaFormateada;
        }

        const getHoraChequeo = () => {
            let fechaActual = new Date();
            let horas = String(fechaActual.getHours()).padStart(2, '0'); // Obtiene la hora y asegura que tenga dos dígitos
            let minutos = String(fechaActual.getMinutes()).padStart(2, '0'); // Obtiene los minutos y asegura que tenga dos dígitos
            let horaFormateada = `${3 + Number(horas)}:${minutos}`;
            return horaFormateada;
        }

        const getFechaChequeo = () => {
            let fechaOriginal = new Date();
            let año = fechaOriginal.getFullYear();
            let mes = String(fechaOriginal.getMonth() + 1).padStart(2, '0'); // Obtiene el mes (0-11), así que se suma 1 y se formatea
            let dia = String(fechaOriginal.getDate()).padStart(2, '0'); // Obtiene el día
            let fechaFormateada = `${año}-${mes}-${dia}`;
            fechaFormateada = new Date(fechaFormateada);
            let horaChequeo = getHoraChequeo()
            fechaFormateada.setHours(fechaFormateada.getHours() + Number(horaChequeo.split(":")[0]));
            let fechaAjustada = fechaFormateada.toISOString();
            return fechaAjustada;
        }

        const obtenerDispositivo = (id, subsidiaria) => {
            if (!id) return;
            let Dispositivo = search.lookupFields({
                type: 'customrecord_ht_record_mantchaser', id: id,
                columns: [
                    'custrecord_ht_mc_vid',
                    'custrecord_ht_mc_modelo',
                    'custrecord_ht_mc_unidad',
                    'custrecord_ht_mc_seriedispositivo',
                    'custrecord_ht_mc_imei',
                    'name',
                    'custrecord_ht_mc_nocelularsim',
                    'custrecord_ht_mc_operadora',
                    'custrecord_ht_mc_operadora.custrecord_ht_cs_operadora_codigo',
                    'custrecord_ht_mc_operadora.custrecord_ht_cs_operadora_descrip',
                    'custrecord_ht_mc_ip',
                    'custrecord_ht_mc_celularsimcard',
                    'custrecord_ht_mc_estadosimcard',
                    //'custrecord_ht_mc_estado',
                    //'custrecord_ht_mc_estadolodispositivo',
                    'custrecord_ht_mc_modelo.custrecord_ht_dd_mod_disp_id_telematic',
                    'custrecord_ht_mc_modelo.custrecord_ht_md_servidor_relacionado',
                    'custrecord_ht_mc_modelo.custrecord_ht_dd_modelodispositivo_codig',
                    'custrecord_ht_mc_modelo.custrecord_ht_dd_modelodispositivo_descr',
                    'custrecord_ht_mc_unidad.custrecord_ht_dd_tipodispositivo_codigo',
                    'custrecord_ht_mc_unidad.custrecord_ht_dd_tipodispositivo_descrip',
                    'custrecord_ht_mc_macaddress',
                    'custrecord_ht_mc_sn',
                    'custrecord_ht_mc_numero_camara',
                    'custrecord_ht_mc_icc',
                    'custrecord_ht_mc_servidor.custrecord_ht_mc_servidor_id_telematic',
                    'custrecord_ht_mc_servidor',
                    'custrecord_ht_mc_estadolodispositivo'
                ]
            });
            return Dispositivo;
        }

        const obtenerVehiculo = (id, subsidiaria) => {
            if (!id) return;
            let vehiculo = search.lookupFields({
                type: 'customrecord_ht_record_bienes', id: id,
                filters: [
                    ["custrecord_bn_subsidiaria", "anyof", subsidiaria]
                ],
                columns: [
                    'custrecord_ht_bien_placa',
                    'custrecord_ht_bien_marca',
                    'custrecord_ht_bien_modelo',
                    'custrecord_ht_bien_chasis',
                    'custrecord_ht_bien_motor',
                    'custrecord_ht_bien_colorcarseg',
                    'custrecord_ht_bien_tipoterrestre',
                    'custrecord_ht_bien_tipoterrestre.custrecord_ht_tt_idtelematic',
                    'name',
                    'custrecord_ht_bn_estadobien',
                    'custrecord_ht_bien_ano',
                    'custrecord_ht_bien_codsysh',
                    'custrecord_ht_bien_propietario',
                    'custrecord_ht_bien_consesionarios',
                    'custrecord_ht_bien_companiaseguros',
                    'custrecord_ht_bien_financiadovehiculo',
                    'custrecord_ht_bien_conveniovehiculo',
                    'custrecord_bn_subsidiaria',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_ruccanaldistribucion',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_nombre',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_direccion',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_telefono',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_tipocanal',
                    'custrecord_ht_bien_marca.custrecord_ht_marca_codigo',
                    'custrecord_ht_bien_marca.custrecord_ht_marca_descripcion',
                    'custrecord_ht_bien_modelo.custrecord_ht_mod_codigo',
                    'custrecord_ht_bien_modelo.custrecord_ht_mod_descripcion',
                    'custrecord_ht_bien_cilindraje',
                    'custrecord_ht_bien_cilindraje.custrecord_ht_record_cilindraje_codigo',
                    'custrecord_ht_bien_cilindraje.custrecord_ht_record_cilindraje_descrip',
                    'custrecord_ht_bien_colorcarseg.custrecord_ht_bn_colorcarseg_codigo',
                    'custrecord_ht_bien_colorcarseg.custrecord_ht_bn_colorcarseg_descripcion',
                    'custrecord_ht_bien_id_telematic',
                    'internalid',
                    'custrecord_ht_bien_tipo',
                    'custrecord_ht_bien_tipo.custrecord_ht_tv_codigo',
                    'custrecord_ht_bien_tipo.custrecord_ht_tv_descripcion',
                    'custrecord_ht_bien_numeropuertas',
                    'custrecord_ht_bien_num_ruedas',
                    'custrecord_ht_bien_max_peso',
                    'custrecord_ht_bien_largo',
                    'custrecord_ht_bien_telefono_emergencia',
                    'altname'
                ]
            });
            return vehiculo;
        }

        const obtenerPropietario = (id, subsidiaria) => {
            if (!id) return;
            let result = {};
            let correoEmail = '';
            let celular = '';
            let convencional = '';
            let city = '';
            let sql = 'SELECT custrecord_ht_email_email as email FROM customrecord_ht_record_correoelectronico WHERE custrecord_ht_email_tipoemail = 1 AND custrecord_ht_ce_enlace = ?';
            let resultSet = query.runSuiteQL({ query: sql, params: [id] });
            let results = resultSet.asMappedResults();
            correoEmail = results.length ? results[0]['email'] : correoEmail;
            let sql2 = 'SELECT custrecord_ht_campo_txt_telefono as celular FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 1 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
            let resultSet2 = query.runSuiteQL({ query: sql2, params: [id] });
            let results2 = resultSet2.asMappedResults();
            celular = results2.length ? results2[0]['celular'].replace('+593', '0') : celular;
            let sql3 = 'SELECT custrecord_ht_campo_txt_telefono as convencional FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 10 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
            let resultSet3 = query.runSuiteQL({ query: sql3, params: [id] });
            let results3 = resultSet3.asMappedResults();
            convencional = results3.length ? results3[0]['convencional'].replace('+593', '0') : convencional;
            let sql4 = 'SELECT addressbookaddress FROM customeraddressbook WHERE entity = ?'
            let resultSet4 = query.runSuiteQL({ query: sql4, params: [id] });
            let results4 = resultSet4.asMappedResults();
            if (results4.length > 0) {
                let sql5 = 'SELECT addr1, addr2, city, zip, country FROM customerAddressbookEntityAddress WHERE nkey = ?'
                let resultSet5 = query.runSuiteQL({ query: sql5, params: [results4[0]['addressbookaddress']] });
                let results5 = resultSet5.asMappedResults();
                if (results5.length > 0) {
                    city = (results5[0]['addr1'] == null ? '' : results5[0]['addr1']) + ' ' + (results5[0]['addr2'] == null ? '' : results5[0]['addr2']) + ' ' + (results5[0]['city'] == null ? '' : results5[0]['city']) + ' ' + (results5[0]['zip'] == null ? '' : results5[0]['zip']) + ' ' + (results5[0]['country'] == null ? '' : results5[0]['country'])
                }
            }
            let Propietario = search.lookupFields({
                type: 'customer', id: id,
                // filters: [
                //     ["custrecord_ht_ce_enlace", "anyof", subsidiaria]
                // ],
                columns: ['entityid',
                    'custentity_ht_cl_primernombre',
                    'custentity_ht_cl_segundonombre',
                    'custentity_ht_cl_apellidopaterno',
                    'custentity_ht_cl_apellidomaterno',
                    'phone',
                    'homephone',
                    'email',
                    'vatregnumber',
                    'custentity_ht_customer_id_telematic',
                    'internalid',
                    'custentityts_ec_cod_tipo_doc_identidad',
                    'companyname',
                    'isperson'
                ]
            });
            //let provincia = ObtenerProvincia(id);
            try {   // Log Eliminar 21/08/2024
                let generalCorreos = obtenerCorreosPropietario(id, subsidiaria);
                log.debug('generalCorreos', generalCorreos);
            } catch (error) {
                log.debug('error Integracion', error);
            }
            result.htEmail = obtenerCorreosPropietario(id, subsidiaria);
            result.entityid = Propietario.entityid.length ? Propietario.entityid : '';
            // result.phone = Propietario.phone.length ? Propietario.phone.replace('+593', '') : '';
            //result.email = Propietario.email.length ? Propietario.email : '';
            result.phone = celular;
            result.email = correoEmail;
            // result.email = generalCorreos?.pxEmail ? generalCorreos?.pxEmail : correoEmail;  // Doas 21/08/2025
            result.vatregnumber = Propietario.vatregnumber.length ? Propietario.vatregnumber : '';
            result.custentity_ht_customer_id_telematic = Propietario.custentity_ht_customer_id_telematic.length ? Propietario.custentity_ht_customer_id_telematic : '';
            result.internalid = Propietario.internalid.length ? Propietario.internalid : '';
            result.isperson = Propietario.isperson;
            // result.provincia = provincia.length ? provincia : '';
            result.provincia = city;
            result.companyname = Propietario.companyname || ""
            result.custentityts_ec_cod_tipo_doc_identidad = Propietario.custentityts_ec_cod_tipo_doc_identidad || "";
            // result.homephone = Propietario.homephone;
            result.homephone = convencional;
            if (result.isperson) {
                result.custentity_ht_cl_primernombre = Propietario.custentity_ht_cl_primernombre.length ? Propietario.custentity_ht_cl_primernombre : '';
                result.custentity_ht_cl_segundonombre = Propietario.custentity_ht_cl_segundonombre.length ? Propietario.custentity_ht_cl_segundonombre : '';
                result.custentity_ht_cl_apellidopaterno = Propietario.custentity_ht_cl_apellidopaterno.length ? Propietario.custentity_ht_cl_apellidopaterno : '';
                result.custentity_ht_cl_apellidomaterno = Propietario.custentity_ht_cl_apellidomaterno.length ? Propietario.custentity_ht_cl_apellidomaterno : '';
            } else {
                result.custentity_ht_cl_primernombre = Propietario.companyname;
            }
            log.debug('result', result)
            return result;
        }

        const obtenerNacionalidad = (id) => {
            let result = {};
            if (id == 2) { result = "EC" }
            if (id == 3) { result = "PE" }
            return result;
        }


        const obtenerCorreosPropietario = (customerId, subsidiaria) => {
            let result = {
                email: "",
                amiEmail: "",
                mainEmail: "",
                convenioEmail: "",
                pxEmail: ""
            };
            let resultSearch = search.create({
                type: "customrecord_ht_record_correoelectronico",
                filters: [
                    ["custrecord_ht_ce_enlace", "anyof", customerId]
                ],
                columns: [
                    search.createColumn({ name: "custrecord_ht_email_tipoemail", label: "HT CE Tipo de Email" }),
                    search.createColumn({ name: "custrecord_ht_email_email", label: "HT CE Email" }),
                    search.createColumn({ name: "custrecord_ht_email_emailprincipal", label: "HT Email Principal" })
                ]
            }).run().getRange(0, 1000);
            if (resultSearch.length) {
                for (let i = 0; i < resultSearch.length; i++) {
                    let email = resultSearch[i].getValue("custrecord_ht_email_email");
                    let emailType = resultSearch[i].getValue("custrecord_ht_email_tipoemail");
                    let mainEmail = resultSearch[i].getValue("custrecord_ht_email_emailprincipal");
                    if (mainEmail) result.mainEmail = email.toLowerCase();
                    if (emailType == "1") result.email = email.toLowerCase();
                    if (emailType == "2") result.amiEmail = email.toLowerCase();
                    if (emailType == "3") result.convenioEmail = email.toLowerCase();
                    if (emailType == "8") result.pxEmail = email.toLowerCase();
                }
            }
            return result;
        }

        const obtenerPropietarioMonitoreo = (salesOrderRecord, itemMonitoreo, subsidiaria) => {
            let city = '';
            let correoEmail = '';
            let celular = '';
            let convencional = '';
            try {
                let itemLines = salesOrderRecord.getLineCount({ sublistId: 'item' });
                let PropietarioMonitoreo = 0;
                for (let j = 0; j < itemLines; j++) {
                    let item = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                    if (itemMonitoreo && item == itemMonitoreo) {
                        PropietarioMonitoreo = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                        break;
                    } else {
                        PropietarioMonitoreo = salesOrderRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                        if (PropietarioMonitoreo) break;
                    }
                }
                var lookupFieldsPropietarioMonitoreo = {};
                if (!PropietarioMonitoreo) return lookupFieldsPropietarioMonitoreo;
                let sql = 'SELECT isperson, id, entityid, custentity_ht_cl_primernombre, custentity_ht_cl_segundonombre, custentity_ht_cl_apellidopaterno, custentity_ht_cl_apellidomaterno, ' +
                    'custentity_ht_customer_id_telematic, custentityts_ec_cod_tipo_doc_identidad, companyname FROM customer WHERE id = ?';
                let resultSet = query.runSuiteQL({ query: sql, params: [PropietarioMonitoreo] });
                let results = resultSet.asMappedResults();
                if (results.length > 0) {
                    let sql1 = 'SELECT custrecord_ht_email_email as email FROM customrecord_ht_record_correoelectronico WHERE custrecord_ht_email_tipoemail = 1 AND custrecord_ht_ce_enlace = ?';
                    let resultSet1 = query.runSuiteQL({ query: sql1, params: [PropietarioMonitoreo] });
                    let results1 = resultSet1.asMappedResults();
                    correoEmail = results1.length ? results1[0]['email'] : correoEmail;
                    let sql2 = 'SELECT custrecord_ht_campo_txt_telefono as celular FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 1 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
                    let resultSet2 = query.runSuiteQL({ query: sql2, params: [PropietarioMonitoreo] });
                    let results2 = resultSet2.asMappedResults();
                    celular = results2.length ? results2[0]['celular'].replace('+593', '0') : celular;
                    let sql3 = 'SELECT custrecord_ht_campo_txt_telefono as convencional FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 10 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
                    let resultSet3 = query.runSuiteQL({ query: sql3, params: [PropietarioMonitoreo] });
                    let results3 = resultSet3.asMappedResults();
                    convencional = results3.length ? results3[0]['convencional'].replace('+593', '0') : convencional;
                    //let provincia = ObtenerProvincia(PropietarioMonitoreo);
                    let sql4 = 'SELECT addressbookaddress FROM customeraddressbook WHERE entity = ?'
                    let resultSet4 = query.runSuiteQL({ query: sql4, params: [PropietarioMonitoreo] });
                    let results4 = resultSet4.asMappedResults();
                    if (results4.length > 0) {
                        let sql5 = 'SELECT addr1, addr2, city, zip, country FROM customerAddressbookEntityAddress WHERE nkey = ?'
                        let resultSet5 = query.runSuiteQL({ query: sql5, params: [results4[0]['addressbookaddress']] });
                        let results5 = resultSet5.asMappedResults();
                        if (results5.length > 0) {
                            city = (results5[0]['addr1'] == null ? '' : results5[0]['addr1']) + ' ' + (results5[0]['addr2'] == null ? '' : results5[0]['addr2']) + ' ' + (results5[0]['city'] == null ? '' : results5[0]['city']) + ' ' + (results5[0]['zip'] == null ? '' : results5[0]['zip']) + ' ' + (results5[0]['country'] == null ? '' : results5[0]['country'])
                        }
                    }
                    try {  // Log Eliminar 21/08/2024
                        let generalCorreos = obtenerCorreosPropietario(PropietarioMonitoreo, subsidiaria);
                        log.debug('generalCorreos', generalCorreos);
                    } catch (error) {
                        log.debug('error Integracion', error);
                    }
                    lookupFieldsPropietarioMonitoreo.htEmail = obtenerCorreosPropietario(PropietarioMonitoreo, subsidiaria);
                    lookupFieldsPropietarioMonitoreo = search.lookupFields({ type: 'customer', id: PropietarioMonitoreo, columns: ['vatregnumber'] });
                    log.debug('lookupFieldsPropietarioMonitoreo', lookupFieldsPropietarioMonitoreo);
                    //let provincia = ObtenerProvincia(PropietarioMonitoreo);
                    lookupFieldsPropietarioMonitoreo.htEmail = obtenerCorreosPropietario(PropietarioMonitoreo, subsidiaria);
                    lookupFieldsPropietarioMonitoreo.entityid = results[0]['entityid'] == null ? '' : results[0]['entityid'];
                    lookupFieldsPropietarioMonitoreo.phone = celular;
                    lookupFieldsPropietarioMonitoreo.homephone = convencional;
                    lookupFieldsPropietarioMonitoreo.email = correoEmail;
                    // lookupFieldsPropietarioMonitoreo.email = generalCorreos?.pxEmail ? generalCorreos?.pxEmail : correoEmail;  // Doas 21/08/2025
                    lookupFieldsPropietarioMonitoreo.vatregnumber = lookupFieldsPropietarioMonitoreo.vatregnumber.length ? lookupFieldsPropietarioMonitoreo.vatregnumber : '';
                    lookupFieldsPropietarioMonitoreo.custentity_ht_customer_id_telematic = results[0]['custentity_ht_customer_id_telematic'] == null ? '' : results[0]['custentity_ht_customer_id_telematic'];
                    lookupFieldsPropietarioMonitoreo.isperson = results[0]['isperson'];
                    lookupFieldsPropietarioMonitoreo.custentityts_ec_cod_tipo_doc_identidad = results[0]['custentityts_ec_cod_tipo_doc_identidad'];
                    lookupFieldsPropietarioMonitoreo.companyname = results[0]["companyname"];
                    lookupFieldsPropietarioMonitoreo.identity = PropietarioMonitoreo;
                    // lookupFieldsPropietarioMonitoreo.provincia = provincia.length ? provincia : '';
                    lookupFieldsPropietarioMonitoreo.provincia = city;
                    if (results[0]['isperson'] == 'F') {
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_primernombre = results[0]['companyname'] == null ? '' : results[0]['companyname']
                    } else {
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_primernombre = results[0]['custentity_ht_cl_primernombre'] == null ? '' : results[0]['custentity_ht_cl_primernombre']
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_segundonombre = results[0]['custentity_ht_cl_segundonombre'] == null ? '' : results[0]['custentity_ht_cl_segundonombre']
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_apellidopaterno = results[0]['custentity_ht_cl_apellidopaterno'] == null ? '' : results[0]['custentity_ht_cl_apellidopaterno']
                        lookupFieldsPropietarioMonitoreo.custentity_ht_cl_apellidomaterno = results[0]['custentity_ht_cl_apellidomaterno'] == null ? '' : results[0]['custentity_ht_cl_apellidomaterno']
                    }
                }
                // lookupFieldsPropietarioMonitoreo = search.lookupFields({
                //     type: 'customer', id: PropietarioMonitoreo,
                //     columns: [
                //         // 'entityid',
                //         // 'custentity_ht_cl_primernombre',
                //         // 'custentity_ht_cl_segundonombre',
                //         // 'custentity_ht_cl_apellidopaterno',
                //         // 'custentity_ht_cl_apellidomaterno',
                //         // 'phone',
                //         // 'homephone',
                //         // 'email',
                //         'vatregnumber',
                //         // 'custentity_ht_customer_id_telematic',
                //         // 'custentityts_ec_cod_tipo_doc_identidad',
                //         // 'companyname',
                //         // 'isperson'
                //     ]
                // });
                // log.debug('lookupFieldsPropietarioMonitoreo', lookupFieldsPropietarioMonitoreo);
                // let provincia = ObtenerProvincia(PropietarioMonitoreo);
                // lookupFieldsPropietarioMonitoreo.htEmail = obtenerCorreosPropietario(PropietarioMonitoreo);
                // lookupFieldsPropietarioMonitoreo.entityid = lookupFieldsPropietarioMonitoreo.entityid.length ? lookupFieldsPropietarioMonitoreo.entityid : '';
                // lookupFieldsPropietarioMonitoreo.phone = lookupFieldsPropietarioMonitoreo.phone.length ? lookupFieldsPropietarioMonitoreo.phone.replace('+593', '0') : '';
                // lookupFieldsPropietarioMonitoreo.email = lookupFieldsPropietarioMonitoreo.email.length ? lookupFieldsPropietarioMonitoreo.email : '';
                // lookupFieldsPropietarioMonitoreo.vatregnumber = lookupFieldsPropietarioMonitoreo.vatregnumber.length ? lookupFieldsPropietarioMonitoreo.vatregnumber : '';
                // lookupFieldsPropietarioMonitoreo.custentity_ht_customer_id_telematic = lookupFieldsPropietarioMonitoreo.custentity_ht_customer_id_telematic.length ? lookupFieldsPropietarioMonitoreo.custentity_ht_customer_id_telematic : '';
                // lookupFieldsPropietarioMonitoreo.isperson = lookupFieldsPropietarioMonitoreo.isperson;
                // lookupFieldsPropietarioMonitoreo.provincia = provincia.length ? provincia : '';
                // if (lookupFieldsPropietarioMonitoreo.isperson) {
                //     lookupFieldsPropietarioMonitoreo.custentity_ht_cl_primernombre = Propietario.custentity_ht_cl_primernombre.length ? Propietario.custentity_ht_cl_primernombre : '';
                //     lookupFieldsPropietarioMonitoreo.custentity_ht_cl_segundonombre = Propietario.custentity_ht_cl_segundonombre.length ? Propietario.custentity_ht_cl_segundonombre : '';
                //     lookupFieldsPropietarioMonitoreo.custentity_ht_cl_apellidopaterno = Propietario.custentity_ht_cl_apellidopaterno.length ? Propietario.custentity_ht_cl_apellidopaterno : '';
                //     lookupFieldsPropietarioMonitoreo.custentity_ht_cl_apellidomaterno = Propietario.custentity_ht_cl_apellidomaterno.length ? Propietario.custentity_ht_cl_apellidomaterno : '';
                // } else {
                //     lookupFieldsPropietarioMonitoreo.custentity_ht_cl_primernombre = Propietario.companyname;
                // }
                return lookupFieldsPropietarioMonitoreo;
            } catch (error) {
                log.debug('error-pxxxx', error);
            }
        }

        const obtenerCobertura = (ordenTrabajo, subsidiaria) => {
            let itemId = ordenTrabajo.getValue('custrecord_ht_ot_item');
            let bienId = ordenTrabajo.getValue('custrecord_ht_ot_vehiculo');
            let clienteId = ordenTrabajo.getValue('custrecord_ht_ot_cliente_id');
            let subsdiaryId = ordenTrabajo.getValue('custrecord_ht_ot_subsidiary');
            log.debug('itemId-pxxxx', itemId);
            log.debug('bienId-pxxxx', bienId);
            log.debug('clienteId-pxxxx', clienteId);
            log.debug('subsdiaryId-pxxxx', subsdiaryId);
            let coberturaSearchResult = search.create({
                type: "customrecord_ht_co_cobertura",
                filters: [
                    ["custrecord_ht_co_bien", "anyof", bienId],
                    "AND",
                    ["custrecord_ht_co_propietario", "anyof", clienteId],
                    "AND",
                    ["custrecord_ht_co_producto", "anyof", itemId],
                    "AND",
                    ["custrecord_ht_co_subsidiaria", "anyof", subsdiaryId]

                ],
                columns: [
                    search.createColumn({ name: "name", sort: search.Sort.ASC, label: "ID" }),
                    search.createColumn({ name: "custrecord_ht_co_estado_cobertura", label: "HT CO Estado Cobertura" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custrecord_ht_co_coberturainicial}, 'YYYY-MM-DD')", label: "Formula (Text)" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custrecord_ht_co_coberturafinal}, 'YYYY-MM-DD')", label: "Formula (Text)" }),
                    search.createColumn({ name: "custrecord_ht_co_coberturainicial" }),
                    search.createColumn({ name: "custrecord_ht_co_coberturafinal" })
                ]
            }).run().getRange(0, 10);
            // log.debug('coberturaSearchResult', coberturaSearchResult);
            let result = {
                name: "",
                custrecord_ht_co_estado_cobertura: "",
                custrecord_ht_co_coberturainicial: "",
                custrecord_ht_co_coberturafinal: "",
                custrecord_ht_co_coberturainicialtext: "",
                custrecord_ht_co_coberturafinaltext: "",
            };
            if (!coberturaSearchResult.length) return result;
            let columns = coberturaSearchResult[0].columns;
            //log.error("coberturaSearchResult........................", coberturaSearchResult[0].getValue(columns[4]));
            return {
                name: coberturaSearchResult[0].getValue("name"),
                custrecord_ht_co_estado_cobertura: coberturaSearchResult[0].getText("custrecord_ht_co_estado_cobertura"),
                custrecord_ht_co_coberturainicialtext: coberturaSearchResult[0].getValue(columns[2]),
                custrecord_ht_co_coberturafinaltext: coberturaSearchResult[0].getValue(columns[3]),
                custrecord_ht_co_coberturainicial: format.parse({ value: coberturaSearchResult[0].getValue(columns[4]), type: format.Type.DATE }),
                custrecord_ht_co_coberturafinal: format.parse({ value: coberturaSearchResult[0].getValue(columns[5]), type: format.Type.DATE })
            };
        }

        const obtenerCoberturaDisp = (IdVehiculo, idfamilia, subsidiaria) => {
            // let itemId = ordenTrabajo.getValue('custrecord_ht_ot_item');
            // let bienId = ordenTrabajo.getValue('custrecord_ht_ot_vehiculo');
            // let clienteId = ordenTrabajo.getValue('custrecord_ht_ot_cliente_id');
            // let subsdiaryId = ordenTrabajo.getValue('custrecord_ht_ot_subsidiary');
            // log.error('itemId-pxxxx', itemId);
            // log.error('bienId-pxxxx', bienId);
            // log.error('clienteId-pxxxx', clienteId);
            // log.error('subsdiaryId-pxxxx', subsdiaryId);
            let coberturaSearchResult = search.create({
                type: "customrecord_ht_co_cobertura",
                filters: [
                    ["custrecord_ht_co_bien", "anyof", IdVehiculo],
                    // "AND", 
                    // ["custrecord_ht_co_estado_cobertura","anyof","2","3"], // Suspendido
                    // NO TIENE LLENO EL CAMPO DE SUBSIDIARIA
                    // "AND",
                    // ["custrecord_ht_co_subsidiaria", "anyof", subsidiaria],
                    "AND",
                    ["custrecord_ht_co_familia_prod", "anyof", idfamilia],
                ],
                columns: [
                    search.createColumn({ name: "name", sort: search.Sort.ASC, label: "ID" }),
                    search.createColumn({ name: "custrecord_ht_co_estado_cobertura", label: "HT CO Estado Cobertura" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custrecord_ht_co_coberturainicial}, 'YYYY-MM-DD')", label: "Formula (Text)" }),
                    search.createColumn({ name: "formulatext", formula: "to_char({custrecord_ht_co_coberturafinal}, 'YYYY-MM-DD')", label: "Formula (Text)" }),
                    search.createColumn({ name: "custrecord_ht_co_coberturainicial" }),
                    search.createColumn({ name: "custrecord_ht_co_coberturafinal" }),
                    search.createColumn({ name: "custrecord_ht_co_numeroserieproducto" }),
                    search.createColumn({ name: "custrecord_ht_co_numerodispositivo" })
                ]
            }).run().getRange(0, 10);
            //log.debug('coberturaSearchResult', coberturaSearchResult);
            let result = {
                name: "",
                custrecord_ht_co_estado_cobertura: "",
                custrecord_ht_co_coberturainicial: "",
                custrecord_ht_co_coberturafinal: "",
                custrecord_ht_co_coberturainicialtext: "",
                custrecord_ht_co_coberturafinaltext: "",
                numeroserieproducto: "",
                numerodispositivo: ""
            };
            if (!coberturaSearchResult.length) return result;
            let columns = coberturaSearchResult[0].columns;
            //log.error("coberturaSearchResult........................", coberturaSearchResult[0].getValue(columns[4]));
            return {
                name: coberturaSearchResult[0].getValue("name"),
                custrecord_ht_co_estado_cobertura: coberturaSearchResult[0].getText("custrecord_ht_co_estado_cobertura"),
                custrecord_ht_co_coberturainicialtext: coberturaSearchResult[0].getValue(columns[2]),
                custrecord_ht_co_coberturafinaltext: coberturaSearchResult[0].getValue(columns[3]),
                custrecord_ht_co_coberturainicial: format.parse({ value: coberturaSearchResult[0].getValue(columns[4]), type: format.Type.DATE }),
                custrecord_ht_co_coberturafinal: format.parse({ value: coberturaSearchResult[0].getValue(columns[5]), type: format.Type.DATE }),
                numeroserieproducto: coberturaSearchResult[0].getValue(columns[6]),
                numerodispositivo: coberturaSearchResult[0].getValue(columns[7]),
            };
        }

        const obtenerSubsidiaria = (subsdiaryId) => {
            if (!subsdiaryId) return {};
            let subsidiary = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: subsdiaryId,
                columns: ["taxidnum", "custrecord_telematic_emergency_phone_num", "custrecord_telematic_assistanc_phone_num", "custrecord_telematic_technic_support_ema", "internalid"]
            });
            return subsidiary;
        }

        const obtenerCanalDistribucion = (idCanalDistribucion, subsidiaria) => {
            if (!idCanalDistribucion) return {};
            let canalDistribucion = search.lookupFields({
                type: "customrecord_ht_record_canaldistribucion",
                id: idCanalDistribucion,
                filters: [
                    ["custrecord_ht_cd_subsidiaria", "anyof", subsidiaria]
                ],
                columns: [
                    "custrecord_ht_cd_ruccanaldistribucion",
                    "custrecord_ht_cd_nombre",
                    "custrecord_ht_cd_telefono",
                    "custrecord_ht_cd_direccion",
                    "custrecord_ht_cd_email",
                    "custrecord_ht_cd_convencional"
                ]
            });
            return canalDistribucion;
        }

        const obtenerConvenio = (idConvenio) => {
            if (!idConvenio) return {};
            let convenio = search.lookupFields({
                type: "customrecord_ht_record_convenio",
                id: idConvenio,
                columns: [
                    "custrecord_ht_cn_ruc_convenio",
                    "custrecord_ht_cn_razon_social",
                    "custrecord_ht_cn_direccion",
                    "custrecord_ht_cn_celular",
                    "custrecord_ht_cn_email",
                    "custrecord_ht_cn_convencional"
                ]
            });
            return convenio;
        }

        const obtenerFamilia = (familia, subsidiaria) => {
            let results = [];
            try {
                // log.debug("FAMILIA", familia);
                let FamiliaSearch = search.create({
                    type: "customrecord_ht_cr_pp_valores",
                    filters: [["custrecord_ht_pp_codigo", "is", familia],
                        'AND',
                    //['owner.subsidiary', 'anyof', '2']
                    ['custrecord33', 'anyof', subsidiaria]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({ name: "name" }),
                        search.createColumn({ name: "custrecord_ht_pp_codigo" }),
                    ],
                });
                let searchResult = FamiliaSearch.runPaged();
                searchResult.pageRanges.forEach(function (pageRange) {
                    let myPage = searchResult.fetch({ index: pageRange.index });
                    myPage.data.forEach(function (result) {
                        results.push({
                            id: result.getValue({ name: "internalid" }),
                            name: result.getValue({ name: "name" }),
                            codigo: result.getValue({ name: "custrecord_ht_pp_codigo" }),
                        });
                    });
                });
                return results[0];
            } catch (error) {
                log.debug("error", error);
                return [];
            }
        }

        const obtenerServicios = (filters, subsidiaria) => {
            if (!filters.length) return filters;
            let jsonComand = new Array();
            let mySearch = search.create({
                type: "customrecord_ht_servicios",
                filters:
                    [["internalid", "anyof", filters] ],
                columns:
                    [ search.createColumn({ name: "custrecord_ht_sv_command", label: "Comando" }) ]
            });
            mySearch.run().each(result => {
                if (result.getValue('custrecord_ht_sv_command')) {
                    let comando = result.getText('custrecord_ht_sv_command').split(',');
                    jsonComand = jsonComand.concat(comando);
                }
                return true;
            });
            return jsonComand;
            // let result = [];
            // let newSearch = search.create({
            //     type: "customrecord_ht_servicios",
            //     filters,
            //     columns: ["custrecord_ht_sv_command"]
            // }).run().getRange(0, 1000);

            // for (let i = 0; i < newSearch.length; i++) {
            //     let commands = newSearch[i].getText("custrecord_ht_sv_command").split(',');
            //     result = result.concat(commands);
            // }
            // return result;
        }

        const obtenerCommands = (ordenTrabajo, ordenVenta, subsidiaria) => {
            let filters = ordenTrabajo.getValue("custrecord_ht_ot_servicios_commands");
            //getVehiculoServicios(986819);
            //let filters = ordenVenta.getValue("custbody_ht_os_servicios");
            let commands = obtenerServicios(filters, subsidiaria);
            //let commands = obtenerServiciosPX(filters);
            log.debug("commands..................", commands);
            log.debug("obtenerServicios..................", ordenVenta)
            log.debug("ordenTrabajo..................", ordenTrabajo);
            return commands;
            // let paralizador = ordenTrabajo.getValue("custrecord_ht_ot_paralizador");
            // let aperturaPuertas = ordenTrabajo.getValue("custrecord_ht_ot_boton_panico");
            // let filters = [];
            // if (paralizador) {
            //     let paralizadorField = ordenTrabajo.getField("custrecord_ht_ot_paralizador");
            //     filters.push(["name", "is", paralizadorField.label]);
            // }
            // if (aperturaPuertas) {
            //     let aperturaPuertasField = ordenTrabajo.getField("custrecord_ht_ot_boton_panico");
            //     if (filters.length) filters.push("OR");
            //     filters.push(["name", "is", "APERTURA DE PUERTAS"]);
            // }
            // log.error("filters", filters);
        }

        const obtenerValoresFechaHoy = () => {
            let date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth() + 1;
            let day = date.getDate();
            month = month < 10 ? `0${month}` : month;
            day = day < 10 ? `0${day}` : day;
            return { year, month, day };
        }

        const obtenerEstadoSIM = (idEstadoDispositivo) => {
            let estadoSIM = "";
            if (idEstadoDispositivo == "001") {
                estadoSIM = "ACT";
            } else if (idEstadoDispositivo == "002") {
                estadoSIM = "INA";
            } else if (idEstadoDispositivo == "003") {
                estadoSIM = "INA";
            } else if (idEstadoDispositivo == "004") {
            } else if (idEstadoDispositivo == "005") {
            } else if (idEstadoDispositivo == "006") {
                estadoSIM = "INA";
            } else if (idEstadoDispositivo == "007") {
            }
            return estadoSIM;
        }




        // const setCoberturaValues = (PxAdmin, Cobertura, operacionOrden) => {
        //     PxAdmin["Servicio"] = [];
        // }

        const setAseguradoraValues = (PxAdmin, Aseguradora, operacionOrden) => {
            if (!Aseguradora.custrecord_ht_cd_nombre) return;
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorAseguradora"] = Aseguradora.custrecord_ht_cd_ruccanaldistribucion || "";
                PxAdmin["RazonSocialAseguradora"] = Aseguradora.custrecord_ht_cd_nombre.replace(/&/g, '&amp;') || "";
                PxAdmin["DireccionAseguradora"] = Aseguradora.custrecord_ht_cd_direccion.replace(/&/g, '&amp;') || "";
                PxAdmin["ConvencionalAseguradora"] = Aseguradora.custrecord_ht_cd_convencional.replace('+593', '0');
                PxAdmin["CelularAseguradora"] = Aseguradora.custrecord_ht_cd_telefono.replace('+593', '0') || "";
                PxAdmin["EmailAseguradora"] = Aseguradora.custrecord_ht_cd_email || "";
            } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                PxAdmin["IdentificadorAseguradora"] = Aseguradora.custrecord_ht_cd_ruccanaldistribucion || "";
                PxAdmin["RazonSocialAseguradora"] = Aseguradora.custrecord_ht_cd_nombre.replace(/&/g, '&amp;') || "";
                PxAdmin["DireccionAseguradora"] = Aseguradora.custrecord_ht_cd_direccion.replace(/&/g, '&amp;') || "";
                PxAdmin["ConvencionalAseguradora"] = Aseguradora.custrecord_ht_cd_convencional.replace('+593', '0');
                PxAdmin["CelularAseguradora"] = Aseguradora.custrecord_ht_cd_telefono.replace('+593', '0') || "";
                PxAdmin["EmailAseguradora"] = Aseguradora.custrecord_ht_cd_email || "";
            }
        }

        const setConcesionarioValues = (PxAdmin, Concesionario, operacionOrden) => {
            if (!Concesionario.custrecord_ht_cd_nombre) return;
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorConcesionario"] = Concesionario.custrecord_ht_cd_ruccanaldistribucion || "";
                PxAdmin["RazonSocialConcesionario"] = Concesionario.custrecord_ht_cd_nombre || "";
                PxAdmin["DireccionConcesionario"] = Concesionario.custrecord_ht_cd_direccion || "";
                PxAdmin["ConvencionalConcesionario"] = Concesionario.custrecord_ht_cd_convencional.replace('+593', '0');
                PxAdmin["CelularConcesionario"] = Concesionario.custrecord_ht_cd_telefono.replace('+593', '0') || "";
                PxAdmin["EmailConcesionario"] = Concesionario.custrecord_ht_cd_email || "";
            } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                PxAdmin["IdentificadorConcesionario"] = Concesionario.custrecord_ht_cd_ruccanaldistribucion || "";
                PxAdmin["RazonSocialConcesionario"] = Concesionario.custrecord_ht_cd_nombre || "";
                PxAdmin["DireccionConcesionario"] = Concesionario.custrecord_ht_cd_direccion || "";
                PxAdmin["ConvencionalConcesionario"] = Concesionario.custrecord_ht_cd_convencional.replace('+593', '0');
                PxAdmin["CelularConcesionario"] = Concesionario.custrecord_ht_cd_telefono.replace('+593', '0') || "";
                PxAdmin["EmailConcesionario"] = Concesionario.custrecord_ht_cd_email || "";
            }
        }

        const setFinancieraValues = (PxAdmin, Financiera, operacionOrden) => {
            if (!Financiera.custrecord_ht_cd_nombre) return;
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorFinanciera"] = Financiera.custrecord_ht_cd_ruccanaldistribucion || "";
                PxAdmin["RazonSocialFinanciera"] = Financiera.custrecord_ht_cd_nombre || "";
                PxAdmin["DireccionFinanciera"] = Financiera.custrecord_ht_cd_direccion || "";
                PxAdmin["ConvencionalFinanciera"] = Financiera.custrecord_ht_cd_convencional.replace('+593', '0');
                PxAdmin["CelularFinanciera"] = Financiera.custrecord_ht_cd_telefono.replace('+593', '0') || "";
                PxAdmin["EmailFinanciera"] = Financiera.custrecord_ht_cd_email || "";
            } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                PxAdmin["IdentificadorFinanciera"] = Financiera.custrecord_ht_cd_ruccanaldistribucion || "";
                PxAdmin["RazonSocialFinanciera"] = Financiera.custrecord_ht_cd_nombre || "";
                PxAdmin["DireccionFinanciera"] = Financiera.custrecord_ht_cd_direccion || "";
                PxAdmin["ConvencionalFinanciera"] = Financiera.custrecord_ht_cd_convencional.replace('+593', '0');
                PxAdmin["CelularFinanciera"] = Financiera.custrecord_ht_cd_telefono.replace('+593', '0') || "";
                PxAdmin["EmailFinanciera"] = Financiera.custrecord_ht_cd_email || "";
            }
        }

        const setConvenioValues = (PxAdmin, Convenio, operacionOrden) => {
            if (!Convenio.custrecord_ht_cn_ruc_convenio) return;
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorConvenio"] = Convenio.custrecord_ht_cn_ruc_convenio || "";
                PxAdmin["RazonSocialConvenio"] = Convenio.custrecord_ht_cn_razon_social || "";
                PxAdmin["DireccionConvenio"] = Convenio.custrecord_ht_cn_direccion || "";
                PxAdmin["ConvencionalConvenio"] = Convenio.custrecord_ht_cn_convencional.replace('+593', '0');
                PxAdmin["CelularConvenio"] = Convenio.custrecord_ht_cn_celular.replace('+593', '0') || "";
                PxAdmin["EmailConvenio"] = Convenio.custrecord_ht_cn_email || "";
            } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                PxAdmin["IdentificadorConvenio"] = Convenio.custrecord_ht_cn_ruc_convenio || "";
                PxAdmin["RazonSocialConvenio"] = Convenio.custrecord_ht_cn_razon_social || "";
                PxAdmin["DireccionConvenio"] = Convenio.custrecord_ht_cn_direccion || "";
                PxAdmin["ConvencionalConvenio"] = Convenio.custrecord_ht_cn_convencional.replace('+593', '0');
                PxAdmin["CelularConvenio"] = Convenio.custrecord_ht_cn_celular.replace('+593', '0') || "";
                PxAdmin["EmailConvenio"] = Convenio.custrecord_ht_cn_email || "";
            }
        }

        const setMonitoreoValues = (PxAdmin, PropietarioMonitoreo, operacionOrden) => {
            // let persona = PropietarioMonitoreo.isperson;
            let convencional = '';
            if (!PropietarioMonitoreo.vatregnumber) return;
            // log.debug('IDMONITOREO', PropietarioMonitoreo);
            let sql3 = 'SELECT custrecord_ht_campo_txt_telefono as convencional FROM customrecord_ht_registro_telefono WHERE custrecord_ht_campo_list_tipo_telefono = 10 AND custrecord_ht_campo_lbl_entidad_telefono = ?'
            let resultSet3 = query.runSuiteQL({ query: sql3, params: [PropietarioMonitoreo.identity] });
            let results3 = resultSet3.asMappedResults();
            convencional = results3.length ? results3[0]['convencional'].replace('+593', '0') : convencional;
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorMonitorea"] = PropietarioMonitoreo.vatregnumber;
                PxAdmin["NombreMonitorea"] = (typeof PropietarioMonitoreo.custentity_ht_cl_primernombre == 'undefined' ? '' : PropietarioMonitoreo.custentity_ht_cl_primernombre).replace(/&/g, '&amp;') + ' ' + (typeof PropietarioMonitoreo.custentity_ht_cl_segundonombre == 'undefined' ? '' : PropietarioMonitoreo.custentity_ht_cl_segundonombre).replace(/&/g, '&amp;');
                PxAdmin["ApellidosMonitorea"] = (typeof PropietarioMonitoreo.custentity_ht_cl_apellidopaterno == 'undefined' ? '' : PropietarioMonitoreo.custentity_ht_cl_apellidopaterno).replace(/&/g, '&amp;') + ' ' + (typeof PropietarioMonitoreo.custentity_ht_cl_apellidomaterno == 'undefined' ? '' : PropietarioMonitoreo.custentity_ht_cl_apellidomaterno);
                PxAdmin["DireccionMonitorea"] = PropietarioMonitoreo.provincia.replace(/&/g, '&amp;');
                PxAdmin["ConvencionalMonitorea"] = convencional;
                PxAdmin["CelularMonitorea"] = PropietarioMonitoreo.phone.replace('+593', '0');
                PxAdmin["EmailMonitorea"] = PropietarioMonitoreo.email;
            } else if (operacionOrden == OPERACION_ORDEN_CAMBIO_PROPIETARIO) {
                PxAdmin["IdentificadorMonitorea"] = PropietarioMonitoreo.vatregnumber;
                PxAdmin["NombreMonitorea"] = PropietarioMonitoreo.custentity_ht_cl_primernombre.replace(/&/g, '&amp;') + ' ' + PropietarioMonitoreo.custentity_ht_cl_segundonombre.replace(/&/g, '&amp;');
                PxAdmin["ApellidosMonitorea"] = PropietarioMonitoreo.custentity_ht_cl_apellidopaterno.replace(/&/g, '&amp;') + ' ' + PropietarioMonitoreo.custentity_ht_cl_apellidomaterno;
                PxAdmin["DireccionMonitorea"] = PropietarioMonitoreo.provincia.replace(/&/g, '&amp;');
                PxAdmin["ConvencionalMonitorea"] = convencional;
                PxAdmin["CelularMonitorea"] = PropietarioMonitoreo.phone.replace('+593', '0');
                PxAdmin["EmailMonitorea"] = PropietarioMonitoreo.email;
            }
        }

        const setAuthenticationValues = (PxAdmin) => {
            let { year, month, day } = obtenerValoresFechaHoy();
            PxAdmin["StrToken"] = `SH2PX${year}${month}${day}`;
            //PxAdmin["UserName"] = `PxPrTest`;
            //PxAdmin["Password"] = `PX23$03%16#w`;
            PxAdmin["UserName"] = usuario;
            PxAdmin["Password"] = clave;
            PxAdmin["NACIONALIDAD"] = "";
            PxAdmin["URLPX"] = "";
            //PxAdmin["UsuarioIngreso"] = `PRUEBASYS`;
            //PxAdmin["UsuarioIngreso"] = "WSLTM202502031121"
            PxAdmin["UsuarioIngreso"] = "";
            PxAdmin["FileName"] = "";
            PxAdmin["Respuesta"] = "";
        }

        const setEmptyFields = (PxAdmin) => {
            setOrdenVentaEmptyField(PxAdmin);
            setVehiculoEmptyField(PxAdmin);
            setDispositivoEmptyFields(PxAdmin);
            setPropietarioEmptyFields(PxAdmin);
            setMonitorEmptyFields(PxAdmin);
            setConcesionarioEmptyFields(PxAdmin);
            setFinancieraEmptyFields(PxAdmin);
            setAseguradoraEmptyFields(PxAdmin);
            setConvenioEmptyFields(PxAdmin);
            setServicioEmptyFields(PxAdmin);
        }

        const setOrdenVentaEmptyField = (PxAdmin) => {
            PxAdmin["NumeroOrden"] = "";
            PxAdmin["NombreEjecutiva"] = "";
            PxAdmin["Ciudad"] = "";
            PxAdmin["Sucursal"] = "";
            PxAdmin["EstadoCartera"] = "";
            PxAdmin["FechaInicioCobertura"] = "";
            PxAdmin["FechaFinCobertura"] = "";
        }

        const setVehiculoEmptyField = (PxAdmin) => {
            PxAdmin["Placa"] = "";
            PxAdmin["IdMarca"] = "";
            PxAdmin["DescMarca"] = "";
            PxAdmin["IdModelo"] = "";
            PxAdmin["DescModelo"] = "";
            PxAdmin["CodigoVehiculo"] = "";
            PxAdmin["Chasis"] = "";
            PxAdmin["Motor"] = "";
            PxAdmin["Color"] = "";
            PxAdmin["Anio"] = "";
            PxAdmin["Tipo"] = "";
            PxAdmin["Emergencia"] = "";
        }

        const setDispositivoEmptyFields = (PxAdmin) => {
            PxAdmin["Vid"] = "";
            PxAdmin["IdProducto"] = "";
            PxAdmin["DescProducto"] = "";
            PxAdmin["CodMarcaDispositivo"] = "";
            PxAdmin["MarcaDispositivo"] = "";
            PxAdmin["CodModeloDispositivo"] = "";
            PxAdmin["ModeloDispositivo"] = "";
            PxAdmin["Sn"] = "";
            PxAdmin["Imei"] = "";
            PxAdmin["NumeroCamaras"] = "";
            PxAdmin["DireccionMac"] = "";
            PxAdmin["Icc"] = "";
            PxAdmin["NumeroCelular"] = "";
            PxAdmin["Operadora"] = "";
            PxAdmin["EstadoSim"] = "ACTIVO";
            PxAdmin["ServiciosInstalados"] = "";
            PxAdmin["OperacionDispositivo"] = "";
            PxAdmin["VidAnterior"] = "";
        }

        const setPropietarioEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorPropietario"] = "";
            PxAdmin["NombrePropietario"] = "";
            PxAdmin["ApellidosPropietario"] = "";
            PxAdmin["DireccionPropietario"] = "";
            PxAdmin["ConvencionalPropietario"] = "";
            PxAdmin["CelularPropietario"] = "";
            PxAdmin["EmailPropietario"] = "";
        }

        const setMonitorEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorMonitorea"] = "";
            PxAdmin["NombreMonitorea"] = "";
            PxAdmin["ApellidosMonitorea"] = "";
            PxAdmin["DireccionMonitorea"] = "";
            PxAdmin["ConvencionalMonitorea"] = "";
            PxAdmin["CelularMonitorea"] = "";
            PxAdmin["EmailMonitorea"] = "";
        }

        const setServicioEmptyFields = (PxAdmin) => {
            PxAdmin["CodServicio"] = "";
            PxAdmin["DescripcionServicio"] = "";
            PxAdmin["FechaInicioServicio"] = "";
            PxAdmin["FechaFinServicio"] = "";
            PxAdmin["EstadoServicio"] = "";
        }

        const setConcesionarioEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorConcesionario"] = "";
            PxAdmin["RazonSocialConcesionario"] = "";
            PxAdmin["DireccionConcesionario"] = "";
            PxAdmin["ConvencionalConcesionario"] = "";
            PxAdmin["CelularConcesionario"] = "";
            PxAdmin["EmailConcesionario"] = "";
        }

        const setFinancieraEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorFinanciera"] = "";
            PxAdmin["RazonSocialFinanciera"] = "";
            PxAdmin["DireccionFinanciera"] = "";
            PxAdmin["ConvencionalFinanciera"] = "";
            PxAdmin["CelularFinanciera"] = "";
            PxAdmin["EmailFinanciera"] = "";
        }

        const setAseguradoraEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorAseguradora"] = "";
            PxAdmin["RazonSocialAseguradora"] = "";
            PxAdmin["DireccionAseguradora"] = "";
            PxAdmin["ConvencionalAseguradora"] = "";
            PxAdmin["CelularAseguradora"] = "";
            PxAdmin["EmailAseguradora"] = "";
        }

        const setConvenioEmptyFields = (PxAdmin) => {
            PxAdmin["IdentificadorConvenio"] = "";
            PxAdmin["RazonSocialConvenio"] = "";
            PxAdmin["DireccionConvenio"] = "";
            PxAdmin["ConvencionalConvenio"] = "";
            PxAdmin["CelularConvenio"] = "";
            PxAdmin["EmailConvenio"] = "";
        }

        const setSalesOrderValues = (PxAdmin, salesOrderId, vehiculo, Cobertura, location, ejecutiva, NACIONALIDAD) => {
            let salesOrder = getSalesOrder(salesOrderId);
            // log.error(".....salesOrder.....", salesOrder.tranid);
            // log.error(".....salesOrder.....", salesOrder.tranid.replace('S001', ''));
            // log.error(".....salesOrder.....", salesOrder.tranid.replace('S001', '').replace(/\D/g, ''));
            if (NACIONALIDAD == "PE") {
                PxAdmin["NumeroOrden"] = salesOrder.tranid.replace('S001', '').replace('M001', '').replace(/\D/g, '');
            } else {
                PxAdmin["NumeroOrden"] = salesOrder.tranid.replace(/\D/g, '');
            }
            // //TODO: BLOQUE DE PRUEBA POR CAMBIO DE NUMERO DE ORDEN
            const fecha = new Date();
            log.debug("Body PX fecha", fecha);
            // const hora = String(fecha.getHours()).padStart(2, '0'); // Hora (0-23)
            // const minutos = String(fecha.getMinutes()).padStart(2, '0'); // Minutos (0-59)
            // const segundos = String(fecha.getSeconds()).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0'); // Día del mes (1-31)
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');  // Mes (0-11) -> Se suma 1 para obtener 1-12
            const anio = fecha.getFullYear();
            // // Concatenamos la fecha en una variable
            // const orden = `${anio}${mes}${dia}${hora}${minutos}`;
            const orden = `${anio}${mes}${dia}`;
            // log.error("Body PX orden", orden);
            // PxAdmin["NumeroOrden"] = orden;
            if (NACIONALIDAD == "PE") {
                PxAdmin["FileName"] = salesOrder.tranid.replace('S001', '').replace('M001', '').replace(/\D/g, '') + "_" + orden;
            } else {
                PxAdmin["FileName"] = salesOrder.tranid.replace(/\D/g, '') + "_" + orden;
            }
            // //TODO: FIN
            PxAdmin["NACIONALIDAD"] = NACIONALIDAD;
            PxAdmin["UsuarioIngreso"] = "OPERAD" + "_" + NACIONALIDAD;
            let estadovehiculo = vehiculo["custrecord_ht_bn_estadobien"] || "";
            log.debug('estadovehiculo.................................', estadovehiculo);
            PxAdmin["EstadoCartera"] = estadovehiculo[0].text;
            PxAdmin["NombreEjecutiva"] = ejecutiva;
            PxAdmin["Sucursal"] = location;
            PxAdmin["Ciudad"] = location;
            PxAdmin["FechaInicioCobertura"] = Cobertura?.custrecord_ht_co_coberturainicial || vehiculo.co;
            PxAdmin["FechaFinCobertura"] = Cobertura?.custrecord_ht_co_coberturafinal || "";
        }

        const setVehiculoValues = (PxAdmin, vehiculo, operacionOrden) => {
            let idMarca = vehiculo["custrecord_ht_bien_marca.custrecord_ht_marca_codigo"] || "";
            let idMarca2 = vehiculo["custrecord_ht_bien_marca"] || "";
            let descMarca = vehiculo["custrecord_ht_bien_marca.custrecord_ht_marca_descripcion"] || "";
            let idModelo = vehiculo["custrecord_ht_bien_modelo.custrecord_ht_mod_codigo"] || "";
            let idModelo2 = vehiculo["custrecord_ht_bien_modelo"] || "";
            let descModelo = vehiculo["custrecord_ht_bien_modelo.custrecord_ht_mod_descripcion"];
            let colorName = vehiculo["custrecord_ht_bien_colorcarseg.custrecord_ht_bn_colorcarseg_descripcion"];
            let tipoVehiculo = vehiculo["custrecord_ht_bien_tipo.custrecord_ht_tv_descripcion"];
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["Emergencia"] = vehiculo.custrecord_ht_bien_telefono_emergencia;
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa;
                PxAdmin["IdMarca"] = idMarca2[0].value; //idMarca;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0].value;//idModelo
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
                PxAdmin["Chasis"] = vehiculo.custrecord_ht_bien_chasis;
                PxAdmin["Motor"] = vehiculo.custrecord_ht_bien_motor;
                PxAdmin["Color"] = colorName;
                PxAdmin["Anio"] = vehiculo.custrecord_ht_bien_ano;
                PxAdmin["Tipo"] = tipoVehiculo;
            } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION) {
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION) {
                PxAdmin["IdMarca"] = idMarca2[0].value;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0].value;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION) {
                PxAdmin["Emergencia"] = vehiculo.custrecord_ht_bien_telefono_emergencia;
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_MODIFICACION) {
                PxAdmin["IdMarca"] = idMarca2[0].value;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0].value;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO) {
                PxAdmin["IdMarca"] = idMarca2[0].value;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0].value;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_COMPONENTES) {
                PxAdmin["Emergencia"] = vehiculo.custrecord_ht_bien_telefono_emergencia;
                PxAdmin["IdMarca"] = idMarca2[0].value;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0].value;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SEGUROS) {
                PxAdmin["Emergencia"] = vehiculo.custrecord_ht_bien_telefono_emergencia;
                PxAdmin["IdMarca"] = idMarca2[0].value;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0].value;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION_SEGUROS) {
                PxAdmin["IdMarca"] = idMarca2[0].value;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0].value;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_CAMBIO_PROPIETARIO) {
                PxAdmin["IdMarca"] = idMarca2[0].value;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0].value;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_RECONEXION) {
                PxAdmin["IdMarca"] = idMarca2[0].value;
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0].value;
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
                // } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS) {
                //     PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS) {
                PxAdmin["IdMarca"] = idMarca2[0] ? idMarca2[0].value : "";
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0] ? idModelo2[0].value : "";
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
                // } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS) {
                //     PxAdmin["IdMarca"] = idMarca2[0].value;
                //     PxAdmin["DescMarca"] = descMarca;
                //     PxAdmin["IdModelo"] = idModelo2[0].value;
                //     PxAdmin["DescModelo"] = descModelo;
                //     PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SERVICIOS) {
                PxAdmin["Emergencia"] = vehiculo.custrecord_ht_bien_telefono_emergencia;
                PxAdmin["IdMarca"] = idMarca2[0] ? idMarca2[0].value : "";
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0] ? idModelo2[0].value : "";
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_ESTADOS) {
                PxAdmin["IdMarca"] = idMarca2[0] ? idMarca2[0].value : "";
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0] ? idModelo2[0].value : "";
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa;
                PxAdmin["IdMarca"] = idMarca2[0] ? idMarca2[0].value : "";
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0] ? idModelo2[0].value : "";
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
                PxAdmin["Chasis"] = vehiculo.custrecord_ht_bien_chasis;
                PxAdmin["Motor"] = vehiculo.custrecord_ht_bien_motor;
                PxAdmin["Color"] = colorName;
                PxAdmin["Anio"] = vehiculo.custrecord_ht_bien_ano;
                PxAdmin["Tipo"] = tipoVehiculo;
            } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_COMPONENTES) {
                PxAdmin["Placa"] = vehiculo.custrecord_ht_bien_placa;
                PxAdmin["IdMarca"] = idMarca2[0] ? idMarca2[0].value : "";
                PxAdmin["DescMarca"] = descMarca;
                PxAdmin["IdModelo"] = idModelo2[0] ? idModelo2[0].value : "";
                PxAdmin["DescModelo"] = descModelo;
                PxAdmin["CodigoVehiculo"] = vehiculo.custrecord_ht_bien_codsysh ? vehiculo.custrecord_ht_bien_codsysh : vehiculo.name;
            }
        }

        const setDispositivoValues = (PxAdmin, Dispositivo, operacionOrden) => {
            try {
                let idUnidad = Dispositivo["custrecord_ht_mc_unidad.custrecord_ht_dd_tipodispositivo_codigo"];
                let descUnidad = Dispositivo["custrecord_ht_mc_unidad.custrecord_ht_dd_tipodispositivo_descrip"];
                let idModelo = Dispositivo["custrecord_ht_mc_modelo.custrecord_ht_dd_modelodispositivo_codig"];
                let descModelo = Dispositivo["custrecord_ht_mc_modelo.custrecord_ht_dd_modelodispositivo_descr"];
                let idUnidad2 = Dispositivo["custrecord_ht_mc_unidad"];
                let idModelo2 = Dispositivo["custrecord_ht_mc_modelo"];
                // Serie
                //let serie = Dispositivo.custrecord_ht_mc_vid.length ? Dispositivo.custrecord_ht_mc_vid : '';
                let serie = Dispositivo?.custrecord_ht_mc_vid ? Dispositivo.custrecord_ht_mc_vid : '';
                let idSerie = serie.length ? serie[0] : '';


                let descOperadora = Dispositivo["custrecord_ht_mc_operadora.custrecord_ht_cs_operadora_descrip"];

                //EstadoSim    custrecord_ht_mc_apn
                //let Estado = Dispositivo.custrecord_ht_mc_estado[0].text.split(' - ');
                let Estado = Dispositivo?.custrecord_ht_mc_estadolodispositivo[0]?.text ? Dispositivo?.custrecord_ht_mc_estadolodispositivo[0]?.text?.split(' - ') : '';
                //let Estado =  Dispositivo ? Dispositivo?.custrecord_ht_mc_estadolodispositivo[0]?.text?.split(' - ') : '';
                let descEstado = Estado.length > 1 ? Estado[1] : '';
                let EstadoSim = Dispositivo ? Dispositivo?.custrecord_ht_mc_estadosimcard[0]?.text : '';
                if (EstadoSim == "ACTIVO") {
                    EstadoSim = "ACT"
                } else if (EstadoSim == "CORTADO") {
                    EstadoSim = "COR"
                } else if (EstadoSim == "INACTIVO") {
                    EstadoSim = "INA"
                } else if (EstadoSim == "ANULADO") {
                    EstadoSim = "INA"
                }
                let producto = Dispositivo.producto ? Dispositivo.producto.split(' - ') : "";
                let idProducto = producto.length ? producto[0] : '';
                let descProducto = producto.length > 1 ? producto[1] : '';
                //let estadoDispositivo = Dispositivo.custrecord_ht_mc_estadolodispositivo.length ? Dispositivo.custrecord_ht_mc_estadolodispositivo[0].text.split(' - ') : '';
                let estadoDispositivo = Dispositivo?.custrecord_ht_mc_estadolodispositivo[0]?.text ? Dispositivo?.custrecord_ht_mc_estadolodispositivo[0]?.text?.split(' - ') : '';
                //let estadoDispositivo = Dispositivo?.custrecord_ht_mc_estadolodispositivo ? Dispositivo?.custrecord_ht_mc_estadolodispositivo[0]?.text?.split(' - ') : '';
                let idEstadoDispositivo = estadoDispositivo.length ? estadoDispositivo[0] : "";
                //let estadoSim = obtenerEstadoSIM(idEstadoDispositivo);
                log.debug("Dispositivo........................", Dispositivo);
                log.debug("estadoDispositivo........................", estadoDispositivo);
                log.debug("idEstadoDispositivo........................", idEstadoDispositivo);
                if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    PxAdmin["IdProducto"] = idProducto.substr(0, 5);
                    PxAdmin["DescProducto"] = descProducto;
                    PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    PxAdmin["MarcaDispositivo"] = descUnidad;
                    PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    PxAdmin["ModeloDispositivo"] = descModelo;
                    PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                    PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                    PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara.replace(/&/g, '&amp;') || "0";
                    PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                    PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                    PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                    PxAdmin["Operadora"] = descOperadora;
                    PxAdmin["EstadoSim"] = 'ACT';
                    PxAdmin["OperacionDispositivo"] = "I";
                } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION) {
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    PxAdmin["OperacionDispositivo"] = "D";
                } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION) {
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    // PxAdmin["IdProducto"] = Dispositivo.name.substr(0, 5);
                    // PxAdmin["DescProducto"] = Dispositivo.name;
                    PxAdmin["IdProducto"] = idProducto.substr(0, 5);
                    PxAdmin["DescProducto"] = descProducto;
                    PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    PxAdmin["MarcaDispositivo"] = descUnidad;
                    PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    PxAdmin["ModeloDispositivo"] = descModelo;
                    PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                    PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                    PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara.replace(/&/g, '&amp;') || "0";
                    PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                    PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                    PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                    PxAdmin["Operadora"] = descOperadora;
                    // PxAdmin["EstadoSim"] = descEstado;
                    PxAdmin["EstadoSim"] = EstadoSim;
                    PxAdmin["OperacionDispositivo"] = "A";
                } else if (operacionOrden == OPERACION_ORDEN_RENOVACION) {
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    PxAdmin["OperacionDispositivo"] = "A";
                } else if (operacionOrden == OPERACION_ORDEN_MODIFICACION) {
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    PxAdmin["MarcaDispositivo"] = descUnidad;
                    PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    PxAdmin["ModeloDispositivo"] = descModelo;
                    PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                    PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                    PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara.replace(/&/g, '&amp;') || "0";
                    PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                    PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                    PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                    PxAdmin["Operadora"] = descOperadora;
                    //PxAdmin["EstadoSim"] = descEstado;
                    PxAdmin["EstadoSim"] = EstadoSim;
                    PxAdmin["OperacionDispositivo"] = "A";
                } else if (operacionOrden == OPERACION_ORDEN_MANTENIMIENTO_CHEQUEO) {
                    //let estadoSim = obtenerEstadoSIM(idEstadoDispositivo);
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    PxAdmin["MarcaDispositivo"] = descUnidad;
                    PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    PxAdmin["ModeloDispositivo"] = descModelo;
                    PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                    PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                    PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara.replace(/&/g, '&amp;') || "0";
                    PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                    PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                    PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                    PxAdmin["Operadora"] = descOperadora;
                    //PxAdmin["EstadoSim"] = estadoSim;
                    PxAdmin["EstadoSim"] = EstadoSim;
                    PxAdmin["OperacionDispositivo"] = "A";
                } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_COMPONENTES) {
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    PxAdmin["MarcaDispositivo"] = descUnidad;
                    PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    PxAdmin["ModeloDispositivo"] = descModelo;
                    PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                    PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                    PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara.replace(/&/g, '&amp;') || "0";
                    PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                    PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                    PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                    PxAdmin["Operadora"] = descOperadora;
                    //PxAdmin["EstadoSim"] = descEstado;
                    PxAdmin["EstadoSim"] = EstadoSim;
                    PxAdmin["OperacionDispositivo"] = "A";
                } else if (operacionOrden == OPERACION_ORDEN_VENTA_SEGUROS) {
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    PxAdmin["MarcaDispositivo"] = descUnidad;
                    PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    PxAdmin["ModeloDispositivo"] = descModelo;
                    PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                    PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                    PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara.replace(/&/g, '&amp;') || "0";
                    PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                    PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                    PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                    PxAdmin["Operadora"] = descOperadora;
                    //PxAdmin["EstadoSim"] = descEstado;
                    PxAdmin["EstadoSim"] = EstadoSim;
                    PxAdmin["OperacionDispositivo"] = "A";
                } else if (operacionOrden == OPERACION_ORDEN_RENOVACION_SEGUROS) {
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    PxAdmin["MarcaDispositivo"] = descUnidad;
                    PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    PxAdmin["ModeloDispositivo"] = descModelo;
                    PxAdmin["Sn"] = Dispositivo.custrecord_ht_mc_sn;
                    PxAdmin["Imei"] = Dispositivo.custrecord_ht_mc_imei;
                    PxAdmin["NumeroCamaras"] = Dispositivo.custrecord_ht_mc_numero_camara.replace(/&/g, '&amp;') || "0";
                    PxAdmin["DireccionMac"] = Dispositivo.custrecord_ht_mc_macaddress;
                    PxAdmin["Icc"] = Dispositivo.custrecord_ht_mc_icc;
                    PxAdmin["NumeroCelular"] = Dispositivo.custrecord_ht_mc_nocelularsim;
                    PxAdmin["Operadora"] = descOperadora;
                    //PxAdmin["EstadoSim"] = descEstado;
                    PxAdmin["EstadoSim"] = EstadoSim;
                    PxAdmin["OperacionDispositivo"] = "A";
                } else if (operacionOrden == OPERACION_ORDEN_RECONEXION) {
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    PxAdmin["MarcaDispositivo"] = descUnidad;
                    PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    PxAdmin["ModeloDispositivo"] = descModelo;
                    PxAdmin["OperacionDispositivo"] = "A";
                    // } else if (operacionOrden == OPERACION_ORDEN_DESINSTALACION_OTROS_PRODUCTOS) {
                    //     PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    //     PxAdmin["OperacionDispositivo"] = "D";
                } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_OTROS_PRODUCTOS) {
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    // PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    // PxAdmin["MarcaDispositivo"] = descUnidad;
                    // PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    // PxAdmin["ModeloDispositivo"] = descModelo;
                    PxAdmin["OperacionDispositivo"] = "A";
                    // } else if (operacionOrden == OPERACION_ORDEN_REINSTALACION_OTROS_PRODUCTOS) {
                    //     PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    //     PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    //     PxAdmin["MarcaDispositivo"] = descUnidad;
                    //     PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    //     PxAdmin["ModeloDispositivo"] = descModelo;
                    //     PxAdmin["OperacionDispositivo"] = "I";
                } else if (operacionOrden == OPERACION_ORDEN_VENTA_SERVICIOS) {
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    PxAdmin["MarcaDispositivo"] = descUnidad;
                    PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    PxAdmin["NumeroCamaras"] = "0";
                    PxAdmin["ModeloDispositivo"] = descModelo;
                    PxAdmin["OperacionDispositivo"] = "A";
                } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS) {
                    // PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    // PxAdmin["MarcaDispositivo"] = descUnidad;
                    // PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    // PxAdmin["ModeloDispositivo"] = descModelo;
                    PxAdmin["OperacionDispositivo"] = "A";
                } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_ESTADOS) {
                    PxAdmin["Vid"] = Dispositivo.custrecord_ht_mc_vid;
                    //PxAdmin["IdProducto"] = Dispositivo.name.substr(0, 5);
                    //PxAdmin["DescProducto"] = Dispositivo.name;
                    // se modifico por pedido de Erwin 28-05-2025
                    // PxAdmin["IdProducto"] = idProducto.substr(0, 5);
                    // PxAdmin["DescProducto"] = descProducto;
                    // PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    // PxAdmin["MarcaDispositivo"] = descUnidad;
                    // PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    // PxAdmin["ModeloDispositivo"] = descModelo;
                    //PxAdmin["EstadoSim"] = Dispositivo.custrecord_ht_mc_estado[0].text.substr(0, 5);
                    PxAdmin["EstadoSim"] = EstadoSim;
                    PxAdmin["OperacionDispositivo"] = "A";
                } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                    PxAdmin["OperacionDispositivo"] = "A";
                } else if (operacionOrden == OPERACION_ORDEN_INSTALACION_COMPONENTES) {
                    PxAdmin["OperacionDispositivo"] = "A";
                    PxAdmin["CodMarcaDispositivo"] = idUnidad2[0].value;
                    PxAdmin["MarcaDispositivo"] = descUnidad;
                    PxAdmin["CodModeloDispositivo"] = idModelo2[0].value;
                    PxAdmin["ModeloDispositivo"] = descModelo;
                }
            } catch (error) {
                log.debug("Error...", error.stack);
                return [];
            }
        }

        const setPropietarioValues = (PxAdmin, Propietario, operacionOrden) => {
            // let persona = Propietario.isperson;
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = Propietario.custentity_ht_cl_primernombre.replace(/&/g, '&amp;') + ' ' + (typeof Propietario.custentity_ht_cl_segundonombre == 'undefined' ? '' : Propietario.custentity_ht_cl_segundonombre).replace(/&/g, '&amp;');
                PxAdmin["ApellidosPropietario"] = (typeof Propietario.custentity_ht_cl_apellidopaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidopaterno).replace(/&/g, '&amp;') + ' ' + (typeof Propietario.custentity_ht_cl_apellidomaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidomaterno);
                PxAdmin["DireccionPropietario"] = Propietario.provincia.replace(/&/g, '&amp;');
                PxAdmin["ConvencionalPropietario"] = Propietario.homephone;
                PxAdmin["CelularPropietario"] = Propietario.phone.length ? Propietario.phone.replace('+593', '0') : '';
                PxAdmin["EmailPropietario"] = Propietario.email;
             } else if (operacionOrden == OPERACION_ORDEN_RENOVACION) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = (typeof Propietario.custentity_ht_cl_primernombre == 'undefined' ? '' : Propietario.custentity_ht_cl_primernombre).replace(/&/g, '&amp;') + ' ' + (typeof Propietario.custentity_ht_cl_segundonombre == 'undefined' ? '' : Propietario.custentity_ht_cl_segundonombre).replace(/&/g, '&amp;');
                PxAdmin["ApellidosPropietario"] = (typeof Propietario.custentity_ht_cl_apellidopaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidopaterno).replace(/&/g, '&amp;') + ' ' + (typeof Propietario.custentity_ht_cl_apellidomaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidomaterno);
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_COMPONENTES) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = (typeof Propietario.custentity_ht_cl_primernombre == 'undefined' ? '' : Propietario.custentity_ht_cl_primernombre).replace(/&/g, '&amp;') + ' ' + (typeof Propietario.custentity_ht_cl_segundonombre == 'undefined' ? '' : Propietario.custentity_ht_cl_segundonombre).replace(/&/g, '&amp;');
                PxAdmin["ApellidosPropietario"] = (typeof Propietario.custentity_ht_cl_apellidopaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidopaterno).replace(/&/g, '&amp;') + ' ' + (typeof Propietario.custentity_ht_cl_apellidomaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidomaterno);
                PxAdmin["DireccionPropietario"] = Propietario.provincia.replace(/&/g, '&amp;');
                PxAdmin["ConvencionalPropietario"] = Propietario.homephone;
                PxAdmin["CelularPropietario"] = Propietario.phone.length ? Propietario.phone.replace('+593', '0') : '';
                PxAdmin["EmailPropietario"] = Propietario.email;
            } else if (operacionOrden == OPERACION_ORDEN_ACTUALIZACION_DATOS_PROPIETARIOS) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = (typeof Propietario.custentity_ht_cl_primernombre == 'undefined' ? '' : Propietario.custentity_ht_cl_primernombre).replace(/&/g, '&amp;') + ' ' + (typeof Propietario.custentity_ht_cl_segundonombre == 'undefined' ? '' : Propietario.custentity_ht_cl_segundonombre).replace(/&/g, '&amp;');
                PxAdmin["ApellidosPropietario"] = (typeof Propietario.custentity_ht_cl_apellidopaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidopaterno).replace(/&/g, '&amp;') + ' ' + (typeof Propietario.custentity_ht_cl_apellidomaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidomaterno);
                PxAdmin["DireccionPropietario"] = Propietario.provincia.replace(/&/g, '&amp;');
                PxAdmin["ConvencionalPropietario"] = Propietario.homephone;
                PxAdmin["CelularPropietario"] = Propietario.phone.length ? Propietario.phone.replace('+593', '0') : '';
                PxAdmin["EmailPropietario"] = Propietario.email;
            } else if (operacionOrden == OPERACION_ORDEN_CAMBIO_PROPIETARIO) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = Propietario.custentity_ht_cl_primernombre.replace(/&/g, '&amp;') + ' ' + (typeof Propietario.custentity_ht_cl_segundonombre == 'undefined' ? '' : Propietario.custentity_ht_cl_segundonombre).replace(/&/g, '&amp;');
                PxAdmin["ApellidosPropietario"] = (typeof Propietario.custentity_ht_cl_apellidopaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidopaterno).replace(/&/g, '&amp;') + ' ' + (typeof Propietario.custentity_ht_cl_apellidomaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidomaterno);
                PxAdmin["DireccionPropietario"] = Propietario.provincia.replace(/&/g, '&amp;');
                PxAdmin["ConvencionalPropietario"] = Propietario.homephone;
                PxAdmin["CelularPropietario"] = Propietario.phone.length ? Propietario.phone.replace('+593', '0') : '';
                PxAdmin["EmailPropietario"] = Propietario.email;
            } else if (operacionOrden == OPERACION_ORDEN_REGISTRAR_CANAL) {
                PxAdmin["IdentificadorPropietario"] = Propietario.vatregnumber;
                PxAdmin["NombrePropietario"] = Propietario.custentity_ht_cl_primernombre.replace(/&/g, '&amp;') + ' ' + (typeof Propietario.custentity_ht_cl_segundonombre == 'undefined' ? '' : Propietario.custentity_ht_cl_segundonombre).replace(/&/g, '&amp;');
                PxAdmin["ApellidosPropietario"] = (typeof Propietario.custentity_ht_cl_apellidopaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidopaterno).replace(/&/g, '&amp;') + ' ' + (typeof Propietario.custentity_ht_cl_apellidomaterno == 'undefined' ? '' : Propietario.custentity_ht_cl_apellidomaterno);
                PxAdmin["DireccionPropietario"] = Propietario.provincia.replace(/&/g, '&amp;');
                PxAdmin["ConvencionalPropietario"] = Propietario.homephone;
                PxAdmin["CelularPropietario"] = Propietario.phone.length ? Propietario.phone.replace('+593', '0') : '';
                PxAdmin["EmailPropietario"] = Propietario.email;
            }
        }

        const setCommandsValues = (PxAdmin, Servicios, operacionOrden, Cobertura) => {
            //let persona = Propietario.isperson;
            log.debug("..........Servicios.....1.........",  Servicios);  
            // log.debug("..........FECHA.....1.........",  Cobertura.custrecord_ht_co_coberturainicialtext);  
            PxAdmin["Alerta"]="N";
            let CodServicioEmergencia = ["042"]
            if (operacionOrden == OPERACION_ORDEN_INSTALACION) {            
                if (Servicios && Servicios.length > 0) {                              
                    PxAdmin["Servicios"]="<ServiciosInstalados>";
                    // for (let i in ResConsulta) {
                    for ( let i=0; i<Servicios.length; i++) {
                        // log.debug("..........Servicios.....2.........",  Servicios[i].split(" - ")[0]);  
                        // log.debug("..........Servicios.....3.........",  Servicios[i].split(" - ")[1]);  
                        PxAdmin["Servicios"]+="<Servicio><CodServicio>" + Servicios[i].split(" - ")[0] + "</CodServicio>";
                        PxAdmin["Servicios"]+="<DescripcionServicio>" + Servicios[i].split(" - ")[1] + "</DescripcionServicio>";
                        PxAdmin["Servicios"]+="<FechaInicioServicio>" + Cobertura.custrecord_ht_co_coberturainicialtext + "</FechaInicioServicio>";
                        PxAdmin["Servicios"]+="<FechaFinServicio>" + Cobertura.custrecord_ht_co_coberturafinaltext + "</FechaFinServicio>";
                        PxAdmin["Servicios"]+="<EstadoServicio>ACTIVO</EstadoServicio>";
                        PxAdmin["Servicios"]+="</Servicio>";
                        if (CodServicioEmergencia.includes(Servicios[i].split(" - ")[0])) {
                            PxAdmin["Alerta"]="S";
                        }
                    }
                    PxAdmin["Servicios"]+="</ServiciosInstalados>"
                    // "<ServiciosInstalados>"+
                    // "<Servicio>"+
                    // "<CodServicio>" + (context.CodServicio || "") + "</CodServicio>" +
                    // "<DescripcionServicio>" + (context.DescripcionServicio || "") + "</DescripcionServicio>" +
                    // "<FechaInicioServicio>" + (context.FechaInicioServicio || "") + "</FechaInicioServicio>" +
                    // "<FechaFinServicio>" + (context.FechaFinServicio || "") + "</FechaFinServicio>" +
                    // "<EstadoServicio>" + (context.EstadoServicio || "") + "</EstadoServicio>" +
                    // "</Servicio>"+
                    // "</ServiciosInstalados>" +
                } else {
                    //PxAdmin["Servicios"]="<ServiciosInstalados><Servicio><CodServicio></CodServicio><DescripcionServicio></DescripcionServicio><FechaInicioServicio></FechaInicioServicio><FechaFinServicio></FechaFinServicio><EstadoServicio></EstadoServicio></Servicio></ServiciosInstalados>";
                    PxAdmin["Servicios"]="<ServiciosInstalados />";
                }
            } else if (operacionOrden == OPERACION_ORDEN_CHEQUEO_COMPONENTES ) {  
                if (Servicios && Servicios.length > 0) {
                    PxAdmin["Servicios"]="<ServiciosInstalados>";
                    for ( let i=0; i<Servicios.length; i++) { 
                        PxAdmin["Servicios"]+="<Servicio><CodServicio>" + Servicios[i].split(" - ")[0] + "</CodServicio>";
                        PxAdmin["Servicios"]+="<DescripcionServicio>" + Servicios[i].split(" - ")[1] + "</DescripcionServicio>";
                        PxAdmin["Servicios"]+="<FechaInicioServicio>" + Cobertura.custrecord_ht_co_coberturainicialtext + "</FechaInicioServicio>";
                        PxAdmin["Servicios"]+="<FechaFinServicio>" + Cobertura.custrecord_ht_co_coberturafinaltext + "</FechaFinServicio>";
                        PxAdmin["Servicios"]+="<EstadoServicio>ACTIVO</EstadoServicio>";
                        PxAdmin["Servicios"]+="</Servicio>";
                        log.debug("Servicios", Servicios[i]);
                        if (CodServicioEmergencia.includes(Servicios[i].split(" - ")[0])) {
                            PxAdmin["Alerta"]="S";
                        }
                    }
                    PxAdmin["Servicios"]+="</ServiciosInstalados>"   
                } else {
                    PxAdmin["Servicios"]="<ServiciosInstalados />";           
                }            
            } else if (operacionOrden == OPERACION_ORDEN_VENTA_SERVICIOS || operacionOrden == OPERACION_ORDEN_VENTA_SEGUROS) {     
                if (Servicios && Servicios.length > 0) {                  
                    PxAdmin["Servicios"]="<ServiciosInstalados>";
                    // for (let i in ResConsulta) {
                    for ( let i=0; i<Servicios.length; i++) {
                        // log.debug("..........Servicios.....2.........",  Servicios[i].split(" - ")[0]);  
                        // log.debug("..........Servicios.....3.........",  Servicios[i].split(" - ")[1]);  
                        PxAdmin["Servicios"]+="<Servicio><CodServicio>" + Servicios[i].split(" - ")[0] + "</CodServicio>";
                        PxAdmin["Servicios"]+="<DescripcionServicio>" + Servicios[i].split(" - ")[1] + "</DescripcionServicio>";
                        PxAdmin["Servicios"]+="<FechaInicioServicio>" + Cobertura.custrecord_ht_co_coberturainicialtext + "</FechaInicioServicio>";
                        PxAdmin["Servicios"]+="<FechaFinServicio>" + Cobertura.custrecord_ht_co_coberturafinaltext + "</FechaFinServicio>";
                        PxAdmin["Servicios"]+="<EstadoServicio>ACTIVO</EstadoServicio>";
                        PxAdmin["Servicios"]+="</Servicio>";                        
                        if (CodServicioEmergencia.includes(Servicios[i].split(" - ")[0])) {
                            PxAdmin["Alerta"]="S";
                        }
                    }
                    PxAdmin["Servicios"]+="</ServiciosInstalados>"
                } else {
                    //PxAdmin["Servicios"]="<ServiciosInstalados><Servicio><CodServicio></CodServicio><DescripcionServicio></DescripcionServicio><FechaInicioServicio></FechaInicioServicio><FechaFinServicio></FechaFinServicio><EstadoServicio></EstadoServicio></Servicio></ServiciosInstalados>";
                    PxAdmin["Servicios"]="<ServiciosInstalados />";
                }
            } else if (operacionOrden == OPERACION_ORDEN_RENOVACION) {  
                if (Servicios && Servicios.length > 0) {
                     for ( let i=0; i<Servicios.length; i++) { 
                        comandos = Servicios[i].servicio.split(",")
                        //log.debug("servicio.", Servicios[i].servicio.split(","));
                    }
                    log.debug("comandos", comandos);
                    for ( let i=0; i<comandos.length; i++) { 
                        //log.debug("comandos....", comandos[i].split(" - ")[0]);
                        if (CodServicioEmergencia.includes(comandos[i].split(" - ")[0])) {
                            PxAdmin["Alerta"]="S";
                        }                   
                    }
                    if (PxAdmin["Alerta"]=="S"){ 
                        PxAdmin["Servicios"]="<ServiciosInstalados>";
                        for ( let i=0; i<comandos.length; i++) { 
                            PxAdmin["Servicios"]+="<Servicio><CodServicio>" + comandos[i].split(" - ")[0] + "</CodServicio>";
                            PxAdmin["Servicios"]+="<DescripcionServicio>" + comandos[i].split(" - ")[1] + "</DescripcionServicio>";
                            PxAdmin["Servicios"]+="<FechaInicioServicio>" + Cobertura.custrecord_ht_co_coberturainicialtext + "</FechaInicioServicio>";
                            PxAdmin["Servicios"]+="<FechaFinServicio>" + Cobertura.custrecord_ht_co_coberturafinaltext + "</FechaFinServicio>";
                            PxAdmin["Servicios"]+="<EstadoServicio>ACTIVO</EstadoServicio>";
                            PxAdmin["Servicios"]+="</Servicio>";
                            log.debug("Servicios", comandos[i]);
                        }
                        PxAdmin["Servicios"]+="</ServiciosInstalados>"  
                    } else {
                        PxAdmin["Servicios"]="<ServiciosInstalados />";           
                    }         
                } else {
                    PxAdmin["Servicios"]="<ServiciosInstalados />";           
                }            
            } else if (operacionOrden != OPERACION_ORDEN_INSTALACION) {
                //PxAdmin["Servicios"]="<ServiciosInstalados><Servicio><CodServicio></CodServicio><DescripcionServicio></DescripcionServicio><FechaInicioServicio></FechaInicioServicio><FechaFinServicio></FechaFinServicio><EstadoServicio></EstadoServicio></Servicio></ServiciosInstalados>";
                PxAdmin["Servicios"]="<ServiciosInstalados />";
            }
        }




        const getSalesOrder = (salesOrderId) => {
            let salesOrderValues = search.lookupFields({
                type: search.Type.SALES_ORDER,
                id: salesOrderId,
                columns: ['tranid']
            });
            return salesOrderValues;
        }

        const getVehiculoServicios = (id, ordenVenta, subsidiaria) => {
            try {
                const vehicleSearchObj = search.create({
                    type: "customrecord_ht_nc_servicios_instalados",
                    filters: [
                        ["custrecord_ns_bien_si", "anyof", id], "AND",
                        ["custrecord_ns_orden_servicio_si", "anyof", ordenVenta]
                    ],
                    columns: [
                        { name: "internalid" },
                        { name: "custrecord_ns_servicio" },
                        { name: "custrecord_ht_si_numero_puertas" },
                        { name: "custrecord_ht_si_novedad" },
                        { name: "custrecord_ht_tipo" }
                    ],
                });
                const myPagedData = vehicleSearchObj.runPaged({ pageSize: 10 });
                let respuesta = [];
                myPagedData.pageRanges.forEach((pageRange) => {
                    const myPage = myPagedData.fetch({ index: pageRange.index });
                    myPage.data.forEach(function (result) {
                        respuesta.push({
                            id: result.getValue({ name: "internalid" }),
                            servicio: result.getText({ name: "custrecord_ns_servicio" }),
                            infservicio: result.getValue({ name: "custrecord_ns_servicio" }),
                            numeroPuertas: result.getValue({ name: "custrecord_ht_si_numero_puertas" }),
                            novedad: result.getValue({ name: "custrecord_ht_si_novedad" }),
                            tipo: result.getText({ name: "custrecord_ht_tipo" })
                        });
                    });
                });
                log.debug("Servicios.....................", respuesta);
                //return respuesta[0];
                return respuesta;
            } catch (e) {
                log.debug("Error en getVehiculoServicios", e);
                return [];
            }
        };

        const getVehiculoServiciosGeneral = (id, subsidiaria)=> {
            try {
              const vehicleSearchObj = search.create({
                type: "customrecord_ht_nc_servicios_instalados",
                filters: [
                          ["custrecord_ns_bien_si", "anyof", id],  
                        ],
                columns: [
                  { name: "internalid" },
                  { name: "custrecord_ns_servicio" },
                  { name: "custrecord_ht_si_numero_puertas" },
                  { name: "custrecord_ht_si_novedad" },
                  { name: "custrecord_ht_tipo" }
                ],
              });    
              const myPagedData = vehicleSearchObj.runPaged({ pageSize: 10 });
              let respuesta = [];     
              myPagedData.pageRanges.forEach((pageRange) => {
                const myPage = myPagedData.fetch({ index: pageRange.index });
                myPage.data.forEach(function (result) {
                  respuesta.push({
                    id: result.getValue({ name: "internalid" }),
                    servicio: result.getText({ name: "custrecord_ns_servicio" }),
                    infservicio: result.getValue({ name: "custrecord_ns_servicio" }),
                    numeroPuertas: result.getValue({ name: "custrecord_ht_si_numero_puertas" }),
                    novedad: result.getValue({ name: "custrecord_ht_si_novedad" }),
                    tipo: result.getText({ name: "custrecord_ht_tipo" })
                  });
                });
              });
              log.debug("Servicios.....................",respuesta);
              //return respuesta[0];
              return respuesta;
            } catch (e) {
              log.debug("Error en getVehiculoServicios", e);
              return [];
            }
        }

        const idItemType = (itemId) => {
            if (!itemId) return "";
            let item = search.lookupFields({
                type: search.Type.SERVICE_ITEM,
                id: itemId,
                columns: ["unitstype"]
            });
            if (item.unitstype) item.unitstype = item.unitstype.length ? item.unitstype[0].value : "";
            return item;
        }

        const obtenerHeaders = () => {
            let headers = {};
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            return headers;
        };

        const sendPXServer = (PxAdmin) => {
            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(PxAdmin),
                deploymentId: 'customdeploy_hu_rs_px_services',
                scriptId: 'customscript_hu_rs_px_services',
                headers: obtenerHeaders(),
            });
            return myRestletResponse;
        }

        const vehiculo = (id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let vehiculo = search.lookupFields({
                type: 'customrecord_ht_record_bienes', id: order.getValue('custrecord_ht_ot_vehiculo'),
                columns: ['custrecord_ht_bien_placa',
                    'custrecord_ht_bien_marca',
                    'custrecord_ht_bien_modelo',
                    'custrecord_ht_bien_chasis',
                    'custrecord_ht_bien_motor',
                    'custrecord_ht_bien_colorcarseg',
                    'custrecord_ht_bien_tipoterrestre',
                    'name',
                    'custrecord_ht_bien_ano',
                    'altname',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_ruccanaldistribucion',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_nombre',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_direccion',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_telefono',
                    'custrecord_ht_bien_consesionarios.custrecord_ht_cd_tipocanal'
                ]
            });
            return vehiculo;
        }

        const Propietario = (id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let Propietario = search.lookupFields({
                type: 'customer', id: order.getValue('custrecord_ht_ot_cliente_id'),
                columns: ['entityid', 'custentity_ht_cl_primernombre', 'custentity_ht_cl_segundonombre',
                    'custentity_ht_cl_apellidopaterno',
                    'custentity_ht_cl_apellidomaterno',
                    'phone',
                    'email',
                    'vatregnumber'
                ]
            });
            return Propietario;
        }

        const Dispositivo = (id) => {
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let Dispositivo = search.lookupFields({
                type: 'customrecord_ht_record_mantchaser', id: order.getValue('custrecord_ht_ot_serieproductoasignacion'),
                columns: [
                    'custrecord_ht_mc_vid',
                    'custrecord_ht_mc_modelo',
                    'custrecord_ht_mc_unidad',
                    'custrecord_ht_mc_seriedispositivo',
                    'custrecord_ht_mc_imei',
                    'name',
                    'custrecord_ht_mc_nocelularsim',
                    'custrecord_ht_mc_operadora',
                    'custrecord_ht_mc_ip',
                    'custrecord_ht_mc_celularsimcard',
                    'custrecord_ht_mc_estadolodispositivo',
                    'custrecord_ht_mc_estadosimcard',
                    //'custrecord_ht_mc_estado'
                ]
            });
            return Dispositivo;
        }

        const PropietarioMonitoreo = (id) => {
            let lookupFieldsPropietarioMonitoreo = 0
            let order = record.load({ type: 'customrecord_ht_record_ordentrabajo', id: id });
            let salesorder = record.load({ type: 'salesorder', id: order.getValue('custrecord_ht_ot_orden_servicio') });
            let inventoryAssignmentLines = salesorder.getLineCount({ sublistId: 'item' });
            let PropietarioMonitoreo = 0;
            for (let j = 0; j < inventoryAssignmentLines; j++) {
                let item = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                if (item == order.getValue('custrecord_ht_ot_item')) {
                    PropietarioMonitoreo = salesorder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_ht_os_cliente_monitoreo', line: j });
                }
            }
            if (PropietarioMonitoreo != 0) {
                lookupFieldsPropietarioMonitoreo = search.lookupFields({
                    type: 'customer', id: PropietarioMonitoreo,
                    columns: [
                        'entityid',
                        'custentity_ht_cl_primernombre',
                        'custentity_ht_cl_segundonombre',
                        'custentity_ht_cl_apellidopaterno',
                        'custentity_ht_cl_apellidomaterno',
                        'phone',
                        'email',
                        'vatregnumber'
                    ]
                });
            }
            return lookupFieldsPropietarioMonitoreo;
        }

        const crearRegistroImpulsoPlataforma = (ordenTrabajoId, activoFijoId, estado, plataforma) => {
            let registroImpulsoPlataforma = record.create({ type: "customrecord_ts_regis_impulso_plataforma" });
            registroImpulsoPlataforma.setValue('custrecord_ts_reg_imp_plt_ordentrabajo', ordenTrabajoId);
            registroImpulsoPlataforma.setValue('custrecord_ts_reg_imp_plt_activo_fijo', activoFijoId || "");
            registroImpulsoPlataforma.setValue('custrecord_ts_reg_imp_plt_estado', estado);
            registroImpulsoPlataforma.setValue('custrecord_ts_reg_imp_plt_plataforma', plataforma);
            return registroImpulsoPlataforma.save();
        }

        const actualizarRegistroImpulsoPlataforma = (registroImpulsoPlataforma, estado, mensaje) => {
            let values = { "custrecord_ts_reg_imp_plt_estado": estado };
            if (estado) values["custrecord_ts_reg_imp_plt_mensaje"] = mensaje;
            record.submitFields({
                type: "customrecord_ts_regis_impulso_plataforma",
                id: registroImpulsoPlataforma,
                values
            });
        }


        return {
            envioPXInstalacionDispositivo,
            envioPXDesinstalacionDispositivo,
            envioPXReinstalacionDispositivo,
            envioPXRenovacionDispositivo,
            envioPXModificacionDispositivo,
            envioPXMantenimientoChequeoDispositivo,
            envioPXChequeoComponentes,
            envioPXVentaSeguros,
            envioPXRenovacionSeguro,
            envioPXCambioPropietario,
            envioPXInstalacionReconexion,
            // envioPXDesinstalacionOtrosProductos,
            envioPXChequeoOtrosProductos,
            // envioPXReinstalacionOtrosProductos,
            envioPXVentaServicios,
            envioPXActualizacionDatosPropietario,
            envioPXActualizacionEstado,
            envioPXRegistrarCanal,
            envioPXInstalacionComponentes,
            // envioTelecInstalacionNueva,
            // envioTelecReinstalacion,
            // envioTelecDesinstalacionDispositivo,
            // envioTelecDesinstalacionDispositivoActivoFijo,
            // envioTelecCambioPropietario,
            // envioTelecActualizacionDatosTecnicos,
            // envioTelecActualizacionDatosClientes,
            // envioTelecActualizacionDatosVehiculo,
            // envioTelecActualizacionActualizacionServicio,
            // envioTelecActualizacionCobertura,
            // envioTelecCorteSim,
            // envioTelecReconexion,
            Propietario,
            vehiculo,
            Dispositivo,
            PropietarioMonitoreo
        }
    }
);