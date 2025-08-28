import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { HumanMessage } from "@langchain/core/messages";
import { leadQualifierChain } from "./evaluator.mjs";

config();

// Tipado de la solicitud según el esquema indicado
interface Solicitud {
  titulares: {
    datos_personales: {
      SITUACION_LABORAL: string;
      FECHA_NACIMIENTO: Date;
      NACIONALIDAD: string;
      SEXO_BIOLOGICO: "HOMBRE" | "MUJER" | "SIN_DEFINIR";
      SEGURIDAD_SOCIAL: string;
      ESTADO_CIVIL: string;
      HIJOS: number;
    };
    ingresos: {
      TIPO: string;
      DETALLE: object;
      PERIODO: "MENSUAL" | "ANUAL";
      MONTO: number;
      FRECUENCIA: number;
    }[];
    deudas: {
      TIPO: string;
      MONTO: number;
      CUOTA: number;
      CUOTAS: number;
    }[];
    garantias: {
      TIPO: "Propiedad inmobiliaria" | "Vehículo" | "Aval personal" | "Otros";
      DETALLE: any;
      MONTO: number;
    }[];
  }[];
  solicitud: {
    precio_inmueble: number;
    precio_tasacion: number;
    ubicacion: string;
    vinculaciones_inaceptables: string[];
    ahorro: number;
    hipoteca_actual: object;
    importe: number;
    anios: number;
    interes: number;
    provincia: string;
    condiciones: string;
  };
}

const app = express();
app.use(cors());
app.use(express.json());

// Normaliza fechas (si vienen como string) a Date para cumplir el tipo
function normalizeSolicitudDates(input: any): Solicitud {
  const copia = { ...input };
  if (Array.isArray(copia?.titulares)) {
    copia.titulares = copia.titulares.map((t: any) => {
      const dp = t?.datos_personales ?? {};
      if (dp?.FECHA_NACIMIENTO && typeof dp.FECHA_NACIMIENTO === "string") {
        dp.FECHA_NACIMIENTO = new Date(dp.FECHA_NACIMIENTO);
      }
      return { ...t, datos_personales: dp };
    });
  }
  return copia as Solicitud;
}

app.post("/evaluar", async (req, res) => {
  try {
    const solicitud = normalizeSolicitudDates(req.body);

    const contenido = `Evalúa la siguiente solicitud de hipoteca. Devuelve JSON con el formato del evaluador.\nSolicitud:\n${JSON.stringify(solicitud)}`;

    const resultado = await leadQualifierChain.invoke({
      messages: [new HumanMessage(contenido)],
    });

    return res.status(200).json(resultado);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Error interno" });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;
app.listen(PORT, () => {
  console.log(`Servidor de pruebas escuchando en http://localhost:${PORT}`);
});
