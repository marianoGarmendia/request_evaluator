import { z } from 'zod';

// Enums para valores específicos
const ClasificacionEnum = z.enum([
  'FAVORABLE',
  'FAVORABLE_CON_CONDICIONES', 
  'DESFAVORABLE_CON_SALVEDADES',
  'DESFAVORABLE',
  'RECHAZADA'
]);

const RiesgoEnum = z.enum(['BAJO', 'MEDIO', 'ALTO', 'MUY_ALTO']);
const TendenciaEnum = z.enum(['ALCISTA', 'ESTABLE', 'BAJISTA']);
const LiquidezEnum = z.enum(['ALTA', 'MEDIA', 'BAJA']);
const HistorialEnum = z.enum(['EXCELENTE', 'BUENO', 'REGULAR', 'MALO', 'SIN_DATOS']);

// Sub-schemas para análisis detallados
const AnalisisCapacidadSchema = z.object({
  puntuacion: z.number().min(0).max(1),
  ratio_cuota_ingresos: z.number(),
  ratio_deuda_total: z.number(),
  ingresos_mensuales_netos: z.number(),
  cuota_estimada_mensual: z.number(),
  margen_financiero_disponible: z.number(),
  capacidad_endeudamiento_teorica: z.number(),
  gastos_familiares_estimados: z.number(),
  evaluacion: z.string(),
  alertas: z.array(z.string())
});

const AnalisisEstabilidadSchema = z.object({
  puntuacion: z.number().min(0).max(1),
  tipo_contrato: z.string(),
  antiguedad_laboral_meses: z.number(),
  sector_actividad: z.string(),
  tamaño_empresa: z.string(),
  estabilidad_ingresos: z.number().min(0).max(1),
  riesgo_desempleo: RiesgoEnum,
  factores_positivos: z.array(z.string()),
  factores_negativos: z.array(z.string()),
  evaluacion: z.string()
});

const AnalisisPerfilSchema = z.object({
  puntuacion: z.number().min(0).max(1),
  deudas_existentes_total: z.number(),
  cuotas_mensuales_existentes: z.number(),
  ratio_deuda_ingresos: z.number(),
  ahorro_disponible: z.number(),
  liquidez_disponible: z.number(),
  historial_crediticio: HistorialEnum,
  comportamiento_pagos: z.string(),
  diversificacion_ingresos: z.number().min(0).max(1),
  capacidad_ahorro_mensual: z.number(),
  evaluacion: z.string(),
  incidencias_crediticias: z.array(z.string())
});

const AnalisisGarantiasSchema = z.object({
  puntuacion: z.number().min(0).max(1),
  valor_inmueble: z.number(),
  importe_solicitado: z.number(),
  ltv_ratio: z.number(),
  valor_tasacion: z.number(),
  aportacion_propia: z.number(),
  garantias_adicionales: z.array(z.object({
    tipo: z.string(),
    valor: z.number(),
    descripcion: z.string()
  })),
  cobertura_total_garantias: z.number(),
  riesgo_garantias: RiesgoEnum,
  evaluacion: z.string()
});

const AnalisisScoringSchema = z.object({
  puntuacion: z.number().min(0).max(1),
  edad_solicitante: z.number(),
  edad_finalizacion_prestamo: z.number(),
  estado_civil: z.string(),
  numero_dependientes: z.number(),
  nivel_estudios: z.string(),
  perfil_riesgo_demografico: z.enum(['CONSERVADOR', 'MODERADO', 'AGRESIVO']),
  score_bureaus_credito: z.number().optional(),
  factores_score: z.array(z.string()),
  evaluacion: z.string()
});

const AnalisisInmuebleSchema = z.object({
  puntuacion: z.number().min(0).max(1),
  ubicacion: z.string(),
  provincia: z.string(),
  tipo_inmueble: z.string(),
  uso_destinado: z.string(),
  ubicacion_score: z.number().min(0).max(1),
  liquidez_mercado: LiquidezEnum,
  tendencia_precios: TendenciaEnum,
  tiempo_venta_estimado_meses: z.number(),
  servicios_entorno: z.array(z.string()),
  conectividad_transporte: z.string(),
  potencial_revalorizacion: z.number().min(0).max(1),
  riesgos_inmueble: z.array(z.string()),
  evaluacion: z.string()
});

const AnalisisRiesgoSchema = z.object({
  puntuacion: z.number().min(0).max(1),
  riesgo_concentracion: z.number().min(0).max(1),
  riesgo_operacional: z.number().min(0).max(1),
  cumplimiento_normativo: z.boolean(),
  complejidad_operacion: z.string(),
  documentacion_completa: z.boolean(),
  alertas_regulatorias: z.array(z.string()),
  evaluacion: z.string()
});

const MatrizRiesgosSchema = z.object({
  riesgo_credito: RiesgoEnum,
  riesgo_mercado: RiesgoEnum,
  riesgo_operacional: RiesgoEnum,
  riesgo_liquidez: RiesgoEnum,
  riesgo_tipo_interes: RiesgoEnum,
  riesgo_general: RiesgoEnum,
  comentarios: z.string()
});

const CondicionesPropuestasSchema = z.object({
  importe_maximo_recomendado: z.number().optional(),
  ltv_maximo_propuesto: z.number().optional(),
  plazo_maximo_años: z.number().optional(),
  tipo_interes_minimo: z.number().optional(),
  aportacion_minima_requerida: z.number().optional(),
  garantias_adicionales_requeridas: z.array(z.string()),
  avalista_requerido: z.boolean(),
  seguros_obligatorios: z.array(z.string()),
  productos_vinculados: z.array(z.object({
    producto: z.string(),
    obligatorio: z.boolean(),
    beneficio: z.string()
  })),
  domiciliacion_nomina: z.boolean(),
  revision_periodica: z.boolean(),
  condiciones_especiales: z.array(z.string())
});

const EscenarioFinanciacionSchema = z.object({
  nombre: z.string(),
  importe_hipoteca: z.number(),
  ltv: z.number(),
  plazo_años: z.number(),
  tipo_interes: z.number(),
  cuota_mensual: z.number(),
  cuota_total_mensual: z.number(),
  ratio_endeudamiento: z.number(),
  viable: z.boolean(),
  observaciones: z.string()
});

// Schema principal de la evaluación
export const MortgageEvaluationSchema = z.object({
  // Identificación de la solicitud
  id_evaluacion: z.string(),
  fecha_evaluacion: z.string().datetime(),
  evaluador: z.string(),
  
  // Resultado principal
  score_final: z.number().min(0).max(1),
  clasificacion: ClasificacionEnum,
  decision_recomendada: z.enum(['APROBAR', 'APROBAR_CON_CONDICIONES', 'SOLICITAR_MEJORAS', 'RECHAZAR']),
  
  // Análisis técnico detallado
  analisis_detallado: z.object({
    capacidad_endeudamiento: AnalisisCapacidadSchema,
    estabilidad_laboral: AnalisisEstabilidadSchema,
    perfil_financiero: AnalisisPerfilSchema,
    garantias_y_patrimonio: AnalisisGarantiasSchema,
    scoring_crediticio: AnalisisScoringSchema,
    evaluacion_inmueble: AnalisisInmuebleSchema,
    riesgo_operacional: AnalisisRiesgoSchema
  }),
  
  // Matriz de riesgos
  matriz_riesgos: MatrizRiesgosSchema,
  
  // Escenarios de financiación analizados
  escenarios_financiacion: z.array(EscenarioFinanciacionSchema),
  escenario_recomendado: z.string().optional(),
  
  // Factores críticos
  factores_riesgo: z.array(z.object({
    factor: z.string(),
    impacto: RiesgoEnum,
    descripcion: z.string(),
    mitigacion_propuesta: z.string().optional()
  })),
  
  fortalezas: z.array(z.object({
    aspecto: z.string(),
    impacto_positivo: z.string(),
    relevancia: z.enum(['ALTA', 'MEDIA', 'BAJA'])
  })),
  
  // Condiciones y recomendaciones
  condiciones_propuestas: CondicionesPropuestasSchema.optional(),
  recomendaciones_especificas: z.array(z.object({
    categoria: z.string(),
    recomendacion: z.string(),
    prioridad: z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAJA']),
    plazo_implementacion: z.string()
  })),
  
  // Informes y conclusiones
  informe_tecnico_conclusion: z.string(),
  justificacion_decision: z.string(),
  
  // ⭐ CAMPO PRINCIPAL PARA RESUMEN ESTÉTICO
  resumen_ejecutivo_cliente: z.string().describe(`
    Resumen ejecutivo en formato markdown dirigido al cliente.
    Debe incluir:
    - 🏠 Introducción personalizada y empática
    - 📊 Resumen de la evaluación en lenguaje no técnico
    - ✅ Fortalezas principales destacadas
    - ⚠️ Áreas de mejora (si las hay)
    - 🎯 Recomendaciones claras y accionables
    - 📈 Pasos siguientes
    - 🤝 Conclusión alentadora y próximos pasos
    
    Usar emojis, formato visual atractivo, tablas simples si es necesario,
    y mantener un tono profesional pero cercano y comprensible.
  `),
  
  // Información adicional
  observaciones_analista: z.string().optional(),
  documentacion_pendiente: z.array(z.string()),
  normativa_aplicable: z.array(z.string()),
  precedentes_similares: z.string().optional(),
  
  // Metadatos
  version_algoritmo: z.string(),
  parametros_utilizados: z.record(z.unknown()),
  disclaimer: z.string()
});

// Tipo TypeScript generado a partir del schema
export type MortgageEvaluation = z.infer<typeof MortgageEvaluationSchema>;

// Ejemplo de uso y validación
export const validateMortgageEvaluation = (data: unknown): MortgageEvaluation => {
  return MortgageEvaluationSchema.parse(data);
};

// Schema para la respuesta parcial (mientras se procesa)
export const MortgageEvaluationPartialSchema = MortgageEvaluationSchema.partial();

export type MortgageEvaluationPartial = z.infer<typeof MortgageEvaluationPartialSchema>;

// Ejemplo de estructura del resumen_ejecutivo_cliente
export const EJEMPLO_RESUMEN_EJECUTIVO = `
# 🏠 Evaluación de su Solicitud Hipotecaria

¡Estimados Andrea y [nombre pareja]! Hemos completado el análisis detallado de su solicitud hipotecaria para la adquisición de su nueva vivienda por valor de **183.000€**.

## 📊 Resultado de la Evaluación

| Concepto | Resultado |
|----------|-----------|
| **Puntuación General** | 🟢 **7.2/10** |
| **Clasificación** | ✅ **FAVORABLE CON CONDICIONES** |
| **Decisión** | 🎯 **APROBACIÓN RECOMENDADA** |

## ✅ Sus Principales Fortalezas

### 💼 **Estabilidad Laboral Excelente**
- Andrea: 2.5 años en Sabadell-Zurich con contrato fijo
- Su pareja: 5 años en Amazon con contrato estable
- **Ambos en empresas sólidas y reconocidas**

### 💰 **Capacidad de Pago Saludable**
- Ingresos combinados: **2.967€ mensuales**
- Ratio de endeudamiento: **32.95%** (dentro del límite saludable del 35%)
- **Excelente gestión de sus finanzas actuales**

### 🏡 **Inmueble Bien Valorado**
- Tasación alineada con precio de compra
- Ubicación en zona con buenas perspectivas
- **Inversión inmobiliaria inteligente**

## ⚠️ Aspectos a Considerar

### 📈 **Optimización Financiera**
- LTV actual del 89% - recomendamos reducir a 80%
- Considerar el escenario ICF para mejorar condiciones
- **Oportunidad de obtener mejores términos**

## 🎯 Nuestras Recomendaciones

### 📋 **Escenario Recomendado: ICF + Hipoteca 80%**
- ✅ Hipoteca bancaria: 146.400€ (80% LTV)
- ✅ Préstamo ICF: 36.600€ al 0% 
- ✅ Cuota total mensual: **977€**
- ✅ Ratio mejorado: **32.95%**

### 🛡️ **Productos Complementarios**
- Seguro de vida recomendado
- Domiciliación de nóminas (posibles bonificaciones)
- Cuenta vinculada con beneficios

## 📈 Próximos Pasos

1. **📞 Contacto inmediato** con entidades bancarias seleccionadas
2. **📄 Preparación** de documentación complementaria
3. **🤝 Negociación** de condiciones finales
4. **✍️ Firma** y formalización

## 🤝 Conclusión

**¡Felicidades!** Su perfil presenta excelentes condiciones para la aprobación hipotecaria. La combinación de estabilidad laboral, ingresos adecuados y una inversión inmobiliaria inteligente hace que su solicitud sea muy atractiva para las entidades financieras.

Estamos aquí para acompañarles en cada paso del proceso hasta conseguir las mejores condiciones para su nueva vivienda.

---
*💡 Este análisis se basa en criterios bancarios actuales y su situación específica. Nuestro equipo está disponible para cualquier consulta adicional.*
`;

export default MortgageEvaluationSchema;