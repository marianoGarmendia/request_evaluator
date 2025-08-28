import {z} from "zod";
// import {ChatAnthropic} from "@langchain/anthropic";
import {ChatOpenAI} from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import {EJEMPLO_RESUMEN_EJECUTIVO} from "./schemaBanco.mjs";


const conclusionPrompt = `

Eres un agente de inteligencia artificial especializado en **evaluación hipotecaria** en el mercado español.  
Tu función es recibir una solicitud estructurada y generar un **informe ejecutivo de viabilidad hipotecaria** para el banco.  

### Instrucciones:
1. Analiza de forma integral los datos de los titulares (laborales, financieros y patrimoniales) y la solicitud de hipoteca.  
2. El informe debe ser **claro y profesional**, redactado en tono formal pero comprensible para un banco, destacando los puntos positivos y negativos.  
3. No enumeres cada parámetro; en su lugar, ofrece una **conclusión ejecutiva**, destacando:
   - La capacidad de pago y ratio de endeudamiento.  
   - La estabilidad laboral y perfil financiero.  
   - Fortalezas principales.  
   - Riesgos o salvedades menores.  
   - Recomendación final sobre la viabilidad de la hipoteca.  
4. Si detectas deudas, ahorro insuficiente u otros riesgos, sugiere recomendaciones de mejora.  
5. Siempre incluye al final un **disclaimer** indicando que la evaluación es automatizada y debe ser revisada por un analista humano antes de una decisión definitiva.  

### Formato de salida:
Un informe estructurado con:
- Encabezado con estado general (Favorable, Favorable con salvedades, No favorable).  
- Un cuerpo con la conclusión ejecutiva.  
- Recomendaciones específicas si corresponden.  
- Disclaimer obligatorio.  

### Ejemplo de salida:

${EJEMPLO_RESUMEN_EJECUTIVO}

`

// const model = new ChatAnthropic({
//   modelName: "claude-sonnet-4-20250514",
//   temperature: 0,
//   })

const model = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0,
  })

const conclusionSchema = z.object({
    informe_de_conclusion: z.string().describe("informe de tipo de la evaluación, detallada, marcando los puntos claves que necesita el banco para tomar una decisión"),
 
    disclaimer: z.string().describe("Texto estándar aclarando las limitaciones de la evaluación automatizada")
});

// Template del prompt
const prompt = ChatPromptTemplate.fromMessages([
    ["system", conclusionPrompt],
    new MessagesPlaceholder("messages"),
  ]);

const conclusionTool = {
    name: "generador_de_conclusion",
    description: "Genera un informe ejecutivo de viabilidad hipotecaria para clientes.",
    schema: conclusionSchema,
    };

    export const conclusionChain = prompt
    .pipe(model.bindTools([conclusionTool],{ tool_choice: "generador_de_conclusion"  }) .withConfig({
      tags: ["nostream"],
    })).pipe((x: any) => {
      const result = x.tool_calls[0].args as z.infer<typeof conclusionSchema>;
      return result;
      });