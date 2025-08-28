import { z } from "zod";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

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
  
 
  
  // Recomendación final
  recomendacion_final: z.string().describe("Recomendación integral y fundamentada sobre la viabilidad de la hipoteca"),
  
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

const evaluatorTool = {
  name: "evaluador_de_solicitud",
  description: "Evalúa todos los datos de la solicitud de hipoteca y devuelve un JSON con el resultado de la evaluación.",
  schema: EvaluacionHipotecaSchema,
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
export const leadQualifierChain = prompt
  .pipe(model.bindTools([evaluatorTool],{ tool_choice: "evaluador_de_solicitud"  }) .withConfig({
    tags: ["nostream"],
  })).pipe((x: any) => {
    const result = x.tool_calls[0].args as z.infer<typeof EvaluacionHipotecaSchema>;
    // Asegurar consistencia de calificado
    
    return result;
    });
 ;

// Exportar también el esquema para uso externo
export { EvaluacionHipotecaSchema };
