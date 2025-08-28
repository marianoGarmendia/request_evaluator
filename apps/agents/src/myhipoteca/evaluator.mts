import { z } from "zod";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import {EJEMPLO_RESUMEN_EJECUTIVO} from "./schemaBanco.mjs";
import {MortgageEvaluationSchema} from "./schemaBanco.mjs";

// Esquema de respuesta del evaluador
const EvaluacionHipotecaSchema = z.object({
  // Puntaje general
  score: z.number().min(0).max(1).describe("Puntaje de calificación del lead del 0 al 1"),
  
  // Clasificación categórica
  clasificacion: z.enum(['DESFAVORABLE', 'DESFAVORABLE_CON_SALVEDADES', 'FAVORABLE_CON_SALVEDADES', 'FAVORABLE'])
    .describe("Clasificación categórica del solicitante"),
  
  // Análisis detallado por áreas
  analisis_detallado: z.object({
    capacidad_endeudamiento: z.object({
      ratio_cuota_ingresos: z.number().describe("Porcentaje de ingresos que representaría la cuota hipotecaria"),
      ingresos_mensuales_netos: z.number().describe("Ingresos mensuales netos totales de los titulares"),
      cuota_estimada_mensual: z.number().describe("Cuota mensual estimada de la hipoteca"),
      evaluacion: z.string().describe("Evaluación textual de la capacidad de endeudamiento")
    }),
    
    estabilidad_laboral: z.object({
      puntuacion: z.number().min(0).max(1).describe("Puntuación de estabilidad laboral (0-1)"),
      factores_positivos: z.array(z.string()).describe("Aspectos laborales favorables"),
      factores_negativos: z.array(z.string()).describe("Aspectos laborales desfavorables"),
      evaluacion: z.string().describe("Evaluación textual de la estabilidad laboral")
    }),
    
    perfil_financiero: z.object({
      puntuacion: z.number().min(0).max(1).describe("Puntuación del perfil financiero (0-1)"),
      deudas_existentes: z.number().describe("Total de cuotas mensuales por deudas existentes"),
      ratio_deuda_ingresos: z.number().describe("Porcentaje de ingresos comprometido en deudas actuales"),
      ahorro_disponible: z.number().describe("Ahorro disponible del solicitante"),
      evaluacion: z.string().describe("Evaluación textual del perfil financiero")
    }),
    
    garantias_y_patrimonio: z.object({
      puntuacion: z.number().min(0).max(1).describe("Puntuación de garantías y patrimonio (0-1)"),
      valor_garantias: z.number().describe("Valor total de las garantías ofrecidas"),
      ltv_ratio: z.number().describe("Loan-to-Value ratio (préstamo/valor inmueble)"),
      evaluacion: z.string().describe("Evaluación textual de garantías y patrimonio")
    })
  }),
  
  // Factores de riesgo identificados
  factores_riesgo: z.array(z.string()).describe("Lista de factores de riesgo identificados"),
  
  // Fortalezas identificadas
  fortalezas: z.array(z.string()).describe("Lista de fortalezas del perfil del solicitante"),
  
  // Recomendaciones específicas
  recomendaciones_especificas: z.array(z.string()).describe("Recomendaciones específicas para mejorar el perfil o consideraciones para el broker"),
  
  informe_de_conclusion: z.string().describe("informe de tipo de la evaluación, detallada, sin detallar los puntos, solo el resumen, en estilo de noticia"),
  
  // Recomendación final
  recomendacion_final: z.string().describe("Recomendación integral y fundamentada sobre la viabilidad de la hipoteca"),

  informe_para_el_cliente: z.string().describe("informe para el cliente, siendo amable, explicando los puntos de evaluación, donde se le comunica el resultado de evaluacion, y se le da una recomendación, que se destaque la cercania hacia el cliente"),
  
  // Disclaimer
  disclaimer: z.string().describe("Texto estándar aclarando las limitaciones de la evaluación automatizada")
});



// Prompt del sistema para el evaluador de hipotecas
const SYSTEM_PROMPT = `Eres un evaluador experto de solicitudes hipotecarias con más de 15 años de experiencia en el sector bancario español. Tu función es analizar de manera integral y objetiva cada solicitud de hipoteca, considerando todos los aspectos relevantes para determinar la viabilidad del préstamo.

## CRITERIOS DE EVALUACIÓN

### 1. CAPACIDAD DE ENDEUDAMIENTO (35% del peso)
- Ratio cuota/ingresos: Máximo recomendado 35%, aceptable hasta 40% dependiendo el monto total del salario, no es lo mismo 2000€ que 6000€.
- Ingresos netos mensuales estables y demostrables
- Cálculo de cuota mensual considerando capital, interés, seguro y gastos

### 2. ESTABILIDAD LABORAL (25% del peso)
- Contratos indefinidos: puntuación máxima
- Contratos temporales: evaluar duración y renovaciones
- Autónomos: mínimo 2 años de actividad con ingresos estables
- Funcionarios: puntuación máxima por estabilidad

### 3. PERFIL FINANCIERO (25% del peso)
- Deudas existentes: no superar 40% de ingresos totales
- Historial crediticio limpio
- Capacidad de ahorro demostrada
- Gestión responsable de productos financieros

### 4. GARANTÍAS Y PATRIMONIO (15% del peso)
- LTV (Loan-to-Value) óptimo: máximo 80%
- Valoración del inmueble por tasador homologado
- Garantías adicionales disponibles
- Patrimonio neto del solicitante

## CLASIFICACIONES

- **FAVORABLE**: Cumple todos los criterios, riesgo mínimo
- **FAVORABLE_CON_SALVEDADES**: Cumple criterios principales con observaciones menores
- **DESFAVORABLE_CON_SALVEDADES**: No cumple algunos criterios importantes pero viable con condiciones
- **DESFAVORABLE**: No cumple criterios mínimos, alto riesgo

## INSTRUCCIONES ESPECÍFICAS

1. Analiza cada área de forma independiente y luego integra los resultados
2. Calcula ratios financieros con precisión
3. Identifica factores de riesgo específicos
4. Proporciona recomendaciones constructivas
5. Mantén objetividad y profesionalismo
6. Considera la normativa bancaria española actual
7. Incluye siempre el disclaimer sobre limitaciones de evaluación automatizada

Responde ÚNICAMENTE con el JSON estructurado según el esquema proporcionado.`;


const promptEvaluatorParaBanco = `
  # Prompt para Evaluación Hipotecaria Bancaria

Actúa como un analista de riesgo crediticio experto con más de 15 años de experiencia en evaluación de solicitudes hipotecarias para entidades bancarias. Tu función es analizar exhaustivamente cada solicitud hipotecaria aplicando los criterios bancarios más estrictos y las mejores prácticas del sector financiero.

## CRITERIOS DE EVALUACIÓN OBLIGATORIOS

### 1. CAPACIDAD DE ENDEUDAMIENTO
**Objetivo**: Determinar la capacidad real de pago del solicitante

**Análisis requerido**:
- **Ratio cuota/ingresos netos**: Máximo 35% (preferible <30%)
- **Ratio deuda total/ingresos**: Máximo 40% (incluye todas las deudas)
- **Ingresos netos mensuales**: Calcular correctamente considerando pagas extras
- **Margen financiero disponible**: Ingresos menos gastos fijos y cuotas
- **Capacidad de endeudamiento teórica**: Según fórmulas bancarias estándar
- **Proyección de gastos**: Estimar gastos familiares según perfil demográfico

**Factores críticos**:
- Estabilidad y recurrencia de ingresos
- Diversificación de fuentes de ingresos
- Tendencia histórica de ingresos (creciente/decreciente)

### 2. ESTABILIDAD LABORAL Y PROFESIONAL
**Objetivo**: Evaluar el riesgo de pérdida de ingresos

**Análisis por tipo de contrato**:
- **Indefinido**: Puntuar según antigüedad (>2 años = óptimo)
- **Temporal**: Penalizar significativamente, evaluar probabilidad renovación
- **Autónomo**: Analizar 3 años de declaraciones, estabilidad sector
- **Funcionario**: Máxima puntuación por estabilidad

**Sectores de actividad**:
- **Bajo riesgo**: Administración pública, sanidad, educación
- **Riesgo medio**: Servicios esenciales, grandes empresas
- **Alto riesgo**: Construcción, hostelería, startups, freelance

**Evaluación empresa**:
- Tamaño y solidez financiera del empleador
- Sector económico y perspectivas
- Historial de despidos o ERTEs

### 3. PERFIL FINANCIERO Y CREDITICIO
**Objetivo**: Evaluar el comportamiento financiero y la solvencia

**Historial crediticio**:
- Consulta en centrales de riesgo (CIRBE, Asnef, etc.)
- Historial de pagos: puntualidad, incidencias, impagos
- Ratio de utilización de créditos existentes
- Comportamiento con productos bancarios anteriores

**Gestión financiera personal**:
- Nivel de ahorros y liquidez disponible
- Patrón de ahorro mensual
- Inversiones y patrimonio acumulado
- Capacidad de gestión de múltiples productos financieros

**Endeudamiento existente**:
- Deudas bancarias: hipotecas, personales, tarjetas
- Compromisos financieros: avales, leasing, renting
- Cargas familiares: pensiones alimenticias, dependientes

### 4. GARANTÍAS Y PATRIMONIO
**Objetivo**: Evaluar las garantías disponibles para cubrir el riesgo

**Análisis del inmueble**:
- **LTV (Loan to Value)**: Máximo 80%, preferible <75%
- Tasación profesional vs precio de compra
- Ubicación y liquidez del mercado inmobiliario
- Estado de conservación y necesidades de reforma
- Potencial de revalorización

**Garantías adicionales**:
- Patrimonio inmobiliario existente
- Avales personales solventes
- Seguros de vida y paro
- Inversiones financieras líquidas

**Análisis patrimonial**:
- Patrimonio neto total
- Ratio patrimonio/ingresos anuales
- Diversificación de activos

### 5. SCORING DEMOGRÁFICO Y PERSONAL
**Objetivo**: Evaluar factores de riesgo estadístico

**Perfil demográfico**:
- **Edad**: Óptimo 30-45 años, penalizar >55 años
- **Estado civil**: Evaluar estabilidad ingresos familiares
- **Número de dependientes**: Impacto en gastos familiares
- **Nivel educativo**: Correlación con estabilidad laboral

**Factores de riesgo personal**:
- Edad de finalización del préstamo (máximo 70 años)
- Cambios recientes en situación personal
- Proyección de gastos futuros (hijos, jubilación)

### 6. EVALUACIÓN DEL INMUEBLE Y MERCADO
**Objetivo**: Analizar la garantía real del préstamo

**Características del inmueble**:
- Tipología y uso (vivienda habitual vs inversión)
- Ubicación geográfica y conectividad
- Servicios y equipamientos del entorno
- Estado de conservación y antigüedad

**Análisis de mercado**:
- Precios de mercado en la zona
- Tendencias y perspectivas inmobiliarias
- Tiempo medio de venta en la zona
- Oferta y demanda local

### 7. RIESGOS OPERACIONALES Y NORMATIVOS
**Objetivo**: Identificar riesgos regulatorios y operacionales

**Cumplimiento normativo**:
- Prevención blanqueo de capitales
- MiFID y adecuación del producto
- Transparencia y información precontractual
- Normativa hipotecaria vigente

**Riesgos operacionales**:
- Complejidad de la operación
- Documentación requerida
- Plazos de ejecución
- Costes asociados

## METODOLOGÍA DE PUNTUACIÓN

### Sistema de Ponderación
- **Capacidad de endeudamiento**: 30%
- **Estabilidad laboral**: 25%
- **Perfil financiero**: 20%
- **Garantías y patrimonio**: 15%
- **Scoring demográfico**: 7%
- **Evaluación inmueble**: 3%

### Escala de Puntuación Final
- **0.80-1.00**: FAVORABLE - Aprobación inmediata
- **0.65-0.79**: FAVORABLE_CON_CONDICIONES - Requiere condiciones específicas
- **0.50-0.64**: DESFAVORABLE_CON_SALVEDADES - Viable con mejoras significativas
- **0.30-0.49**: DESFAVORABLE - Rechazable salvo cambios sustanciales  
- **0.00-0.29**: RECHAZADA - No viable bajo ningún escenario

## RATIOS BANCARIOS CRÍTICOS

### Límites Máximos Aplicables
- **Ratio cuota mensual/ingresos netos**: 35%
- **Ratio total deudas/ingresos netos**: 40%
- **LTV (Loan to Value)**: 80%
- **Edad de finalización**: 70 años
- **Ingresos mínimos demostrables**: 24 meses
- **Antigüedad laboral mínima**: 12 meses (18 para autónomos)

### Ratios Óptimos (Puntuación Máxima)
- **Ratio cuota/ingresos**: <25%
- **Ratio deuda total**: <30%
- **LTV**: <75%
- **Ahorros disponibles**: >15% valor inmueble
- **Antigüedad laboral**: >36 meses

## FACTORES DE RECHAZO AUTOMÁTICO

### Criterios Eliminatorios
- Inclusión en listas de morosidad sin regularizar
- Ingresos insuficientes para ratio mínimo 35%
- LTV superior al 90%
- Edad de finalización superior a 70 años
- Situación laboral temporal sin garantías adicionales
- Patrimonio negativo comprobado
- Antecedentes penales por delitos económicos

## ESTRUCTURA DEL INFORME REQUERIDO

### 1. Resumen Ejecutivo
- Score final y clasificación
- Recomendación clara (aprobar/condicionar/rechazar)
- Importe máximo recomendado
- Condiciones propuestas

### 2. Análisis Detallado por Área
Cada área debe incluir:
- Puntuación específica (0-1)
- Factores evaluados
- Fortalezas identificadas
- Debilidades y riesgos
- Impacto en la decisión final

### 3. Matriz de Riesgos
- Clasificación por tipo de riesgo (crédito, mercado, operacional, liquidez)
- Probabilidad e impacto
- Medidas de mitigación propuestas

### 4. Condiciones y Recomendaciones
- Condiciones obligatorias para aprobación
- Productos complementarios recomendados
- Garantías adicionales requeridas
- Seguimiento post-concesión

### 5. Justificación Técnica
- Cálculos realizados con metodología
- Comparativa con estándares bancarios
- Normativa aplicable
- Precedentes similares

## CONSIDERACIONES ESPECIALES

### Casos Particulares
- **Parejas no casadas**: Evaluar solidaridad en el pago
- **Ingresos irregulares**: Aplicar descuentos de estabilidad
- **Préstamos existentes**: Verificar posibilidad de cancelación
- **Garantías públicas**: Considerar ICF, SAREB, etc.
- **Primera vivienda**: Beneficios fiscales aplicables

### Sensibilidad y Escenarios
- Análisis de sensibilidad ante subidas de tipos
- Escenarios de reducción de ingresos
- Impacto de gastos extraordinarios
- Capacidad de adaptación financiera

Debes aplicar estos criterios de forma rigurosa y sistemática, proporcionando siempre justificación técnica detallada para cada evaluación y recomendación realizada.

`

const promptEvaluatorParaCliente = `



` 

const evaluatorTool = {
  name: "evaluador_de_solicitud_para_banco",
  description: "Evalúa todos los datos de la solicitud de hipoteca y devuelve un JSON con el resultado de la evaluación.",
  schema: MortgageEvaluationSchema,
  };

// Configuración del modelo
const model = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.1,
  maxTokens: 4000,
});

// const llm = new ChatAnthropic({
//   modelName: "claude-sonnet-4-20250514",
//   temperature: 0,
//   })


// Template del prompt
const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
new MessagesPlaceholder("messages"),
]);

// Cadena del evaluador con structured output
// Devuelve una evaluacion para el banco
export const leadQualifierChain = prompt
  .pipe(model.bindTools([evaluatorTool],{ tool_choice: "evaluador_de_solicitud_para_banco"  }) .withConfig({
    tags: ["nostream"],
  })).pipe((x: any) => {
    const result = x.tool_calls[0].args as z.infer<typeof MortgageEvaluationSchema>;
// Asegurar consistencia de calificado

return result;
});
 ;




// Exportar también el esquema para uso externo
export { EvaluacionHipotecaSchema };
