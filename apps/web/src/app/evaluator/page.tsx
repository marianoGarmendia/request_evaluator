"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type SexoBiologico = "HOMBRE" | "MUJER" | "SIN_DEFINIR";
type PeriodoIngreso = "MENSUAL" | "ANUAL";

interface Solicitud {
  titulares: {
    datos_personales: {
      SITUACION_LABORAL: string;
      FECHA_NACIMIENTO: Date | string;
      NACIONALIDAD?: string | null;
      SEXO_BIOLOGICO: SexoBiologico;
      SEGURIDAD_SOCIAL: string;
      ESTADO_CIVIL: string;
      HIJOS: number;
    };
    ingresos: {
      TIPO: string;
      DETALLE: Record<string, any>;
      PERIODO: PeriodoIngreso;
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
    hipoteca_actual: Record<string, any>;
    importe: number;
    anios: number;
    interes: number;
    provincia: string;
    condiciones: string;
  };
}



function buildSolicitudDemo(): Solicitud {
  return {
    titulares: [
      {
        datos_personales: {
          SITUACION_LABORAL: "Empleado por cuenta ajena",
          FECHA_NACIMIENTO: new Date("1990-05-20").toISOString(),
          NACIONALIDAD: null,
          SEXO_BIOLOGICO: "HOMBRE",
          SEGURIDAD_SOCIAL: "1234567890",
          ESTADO_CIVIL: "SOLTERO",
          HIJOS: 5,
        },
        ingresos: [
          {
            TIPO: "NÓMINA",
            DETALLE: { contrato: "Indefinido", empresa: "ACME S.A." },
            PERIODO: "MENSUAL",
            MONTO: 5500,
            FRECUENCIA: 12,
          },
        ],
        deudas: [
          {
            TIPO: "Préstamo personal",
            MONTO: 6000,
            CUOTA: 200,
            CUOTAS: 24,
          },
        ],
        garantias: [
          {
            TIPO: "Propiedad inmobiliaria",
            DETALLE: { descripcion: "Piso en Madrid" },
            MONTO: 120000,
          },
        ],
      },
    ],
    solicitud: {
      precio_inmueble: 180000,
      precio_tasacion: 175000,
      ubicacion: "Madrid",
      vinculaciones_inaceptables: ["Armas", "Cripto riesgosas"],
      ahorro: 30000,
      hipoteca_actual: {},
      importe: 150000,
      anios: 25,
      interes: 3.1,
      provincia: "Madrid",
      condiciones: "Sin bonificaciones especiales",
    },
  };
}



export default function EvaluatorPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  async function handleEnviar() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const solicitud = buildSolicitudDemo();
      const res = await fetch("http://localhost:4001/evaluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(solicitud),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-start justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Evaluador de Solicitudes</h1>
          <p className="mt-2 text-slate-600">Envía una solicitud de ejemplo al servidor local y visualiza la respuesta.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-medium text-slate-900">Acción</h2>
              <p className="text-sm text-slate-600">Se enviará un body con el formato requerido.</p>
            </div>
            <Button onClick={handleEnviar} disabled={loading} className="px-5">
              {loading ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {data && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium text-slate-700">Respuesta</h3>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div className="max-h-[520px] overflow-auto">
                  <pre className="m-0 p-4 text-xs leading-relaxed text-slate-800">
                    <code>{JSON.stringify(data, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Asegúrate de tener el servidor corriendo en http://localhost:4001/evaluar
        </div>
      </div>
    </div>
  );
}


