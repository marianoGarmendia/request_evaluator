"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";

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
          SITUACION_LABORAL: "Funcionario",
          FECHA_NACIMIENTO: new Date("1990-05-20").toISOString(),
          NACIONALIDAD: null,
          SEXO_BIOLOGICO: "HOMBRE",
          SEGURIDAD_SOCIAL: "1234567890",
          ESTADO_CIVIL: "SOLTERO",
          HIJOS: 2,
        },
        ingresos: [
          {
            TIPO: "NÓMINA",
            DETALLE: { contrato: "Indefinido", empresa: "" },
            PERIODO: "MENSUAL",
            MONTO: 7000,
            FRECUENCIA: 12,
          },
        ],
        deudas: [
          {
            TIPO: "Préstamo personal",
            MONTO: 85000,
            CUOTA: 2000,
            CUOTAS: 36,
          },
        ],
        garantias: [
          {
            TIPO: "Propiedad inmobiliaria",
            DETALLE: { descripcion: "La misma propiedad que se está solicitando" },
            MONTO: 0,
          },
        ],
      },
    ],
    solicitud: {
      precio_inmueble: 550000,
      precio_tasacion: 570000,
      ubicacion: "Madrid",
      vinculaciones_inaceptables: ["", "acepta todo"],
      ahorro: 0,
      hipoteca_actual: {},
      importe: 0,
      anios: 20,
      interes: 2.75,
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
            <div className="mt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                {/* Card 1: Resultados Técnicos para el Banco */}
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Resultados Técnicos para el Banco</CardTitle>
                    <CardDescription className="space-y-2">
                      <div className="text-sm">
                        <div className="font-medium mb-1">Clasificación:</div>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium break-words max-w-full ${
                          data.resultadoParaBanco?.clasificacion === 'FAVORABLE' 
                            ? 'bg-green-100 text-green-800'
                            : data.resultadoParaBanco?.clasificacion === 'FAVORABLE_CON_SALVEDADES'
                            ? 'bg-yellow-100 text-yellow-800'
                            : data.resultadoParaBanco?.clasificacion === 'DESFAVORABLE_CON_SALVEDADES'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {data.resultadoParaBanco?.clasificacion || 'N/A'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Score:</span>{" "}
                        <span className="font-mono">{data.resultadoParaBanco?.score_final || 'N/A'}/1.0</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Decisión:</span>{" "}
                        <span className="font-medium text-blue-700">{data.resultadoParaBanco?.decision_recomendada || 'N/A'}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">Ver Informe</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Informe Técnico Detallado</DialogTitle>
                          <DialogDescription>Análisis completo de la solicitud hipotecaria</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                          {/* Análisis Detallado */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Análisis por Áreas</h3>
                            
                            {/* Capacidad de Endeudamiento */}
                            <div className="border rounded-lg p-4 bg-slate-50">
                              <h4 className="font-medium text-slate-900 mb-2">Capacidad de Endeudamiento</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>Puntuación: <span className="font-mono">{data.resultadoParaBanco?.analisis_detallado?.capacidad_endeudamiento?.puntuacion}</span></div>
                                <div>Ratio Cuota/Ingresos: <span className="font-mono">{data.resultadoParaBanco?.analisis_detallado?.capacidad_endeudamiento?.ratio_cuota_ingresos}%</span></div>
                                <div>Ingresos Netos: <span className="font-mono">€{data.resultadoParaBanco?.analisis_detallado?.capacidad_endeudamiento?.ingresos_mensuales_netos}</span></div>
                                <div>Cuota Estimada: <span className="font-mono">€{data.resultadoParaBanco?.analisis_detallado?.capacidad_endeudamiento?.cuota_estimada_mensual}</span></div>
                              </div>
                              <p className="text-sm text-slate-600 mt-2">{data.resultadoParaBanco?.analisis_detallado?.capacidad_endeudamiento?.evaluacion}</p>
                            </div>

                            {/* Estabilidad Laboral */}
                            <div className="border rounded-lg p-4 bg-slate-50">
                              <h4 className="font-medium text-slate-900 mb-2">Estabilidad Laboral</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>Puntuación: <span className="font-mono">{data.resultadoParaBanco?.analisis_detallado?.estabilidad_laboral?.puntuacion}</span></div>
                                <div>Tipo Contrato: <span className="font-medium">{data.resultadoParaBanco?.analisis_detallado?.estabilidad_laboral?.tipo_contrato}</span></div>
                              </div>
                              <p className="text-sm text-slate-600 mt-2">{data.resultadoParaBanco?.analisis_detallado?.estabilidad_laboral?.evaluacion}</p>
                            </div>

                            {/* Perfil Financiero */}
                            <div className="border rounded-lg p-4 bg-slate-50">
                              <h4 className="font-medium text-slate-900 mb-2">Perfil Financiero</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>Puntuación: <span className="font-mono">{data.resultadoParaBanco?.analisis_detallado?.perfil_financiero?.puntuacion}</span></div>
                                <div>Deudas Existentes: <span className="font-mono">€{data.resultadoParaBanco?.analisis_detallado?.perfil_financiero?.deudas_existentes_total}</span></div>
                                <div>Ratio Deuda/Ingresos: <span className="font-mono">{data.resultadoParaBanco?.analisis_detallado?.perfil_financiero?.ratio_deuda_ingresos}%</span></div>
                                <div>Ahorro Disponible: <span className="font-mono">€{data.resultadoParaBanco?.analisis_detallado?.perfil_financiero?.ahorro_disponible}</span></div>
                              </div>
                              <p className="text-sm text-slate-600 mt-2">{data.resultadoParaBanco?.analisis_detallado?.perfil_financiero?.evaluacion}</p>
                            </div>
                          </div>

                          {/* Factores de Riesgo */}
                          {data.resultadoParaBanco?.factores_riesgo && data.resultadoParaBanco.factores_riesgo.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold mb-3">Factores de Riesgo</h3>
                              <div className="space-y-2">
                                {data.resultadoParaBanco.factores_riesgo.map((factor: any, index: number) => (
                                  <div key={index} className="border-l-4 border-red-400 bg-red-50 p-3 rounded">
                                    <div className="font-medium text-red-800">{factor.factor}</div>
                                    <div className="text-sm text-red-600">{factor.descripcion}</div>
                                    <div className="text-xs text-red-500 mt-1">Mitigación: {factor.mitigacion_propuesta}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recomendaciones */}
                          {data.resultadoParaBanco?.recomendaciones_especificas && data.resultadoParaBanco.recomendaciones_especificas.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold mb-3">Recomendaciones Específicas</h3>
                              <div className="space-y-2">
                                {data.resultadoParaBanco.recomendaciones_especificas.map((rec: any, index: number) => (
                                  <div key={index} className="border-l-4 border-blue-400 bg-blue-50 p-3 rounded">
                                    <div className="font-medium text-blue-800">{rec.categoria}</div>
                                    <div className="text-sm text-blue-600">{rec.recomendacion}</div>
                                    <div className="text-xs text-blue-500 mt-1">Prioridad: {rec.prioridad} | Plazo: {rec.plazo_implementacion}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                {/* Card 2: Resumen Ejecutivo */}
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader>
                    <CardTitle className="text-purple-900">Resumen Ejecutivo</CardTitle>
                    <CardDescription>Informe de conclusión</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">Ver Informe</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Resumen Ejecutivo</DialogTitle>
                          <DialogDescription>Informe de conclusión detallado</DialogDescription>
                        </DialogHeader>
                        <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-table:text-sm">
                          <ReactMarkdown
                            components={{
                              h1: ({children}) => <h1 className="text-2xl font-bold text-slate-900 mb-4">{children}</h1>,
                              h2: ({children}) => <h2 className="text-xl font-semibold text-slate-800 mt-6 mb-3">{children}</h2>,
                              h3: ({children}) => <h3 className="text-lg font-medium text-slate-800 mt-4 mb-2">{children}</h3>,
                              table: ({children}) => <table className="min-w-full border-collapse border border-slate-300 my-4">{children}</table>,
                              th: ({children}) => <th className="border border-slate-300 bg-slate-100 px-4 py-2 text-left font-medium">{children}</th>,
                              td: ({children}) => <td className="border border-slate-300 px-4 py-2">{children}</td>,
                              p: ({children}) => <p className="mb-3 leading-relaxed">{children}</p>,
                              ul: ({children}) => <ul className="mb-4 pl-6 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="mb-4 pl-6 space-y-1">{children}</ol>
                            }}
                          >
                            {data.conclusionTipoInforme?.informe_de_conclusion || 'No disponible'}
                          </ReactMarkdown>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                {/* Card 3: Conclusión para Cliente */}
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-green-900">Respuesta al Cliente</CardTitle>
                    <CardDescription>Informe final de conclusión</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">Ver Conclusión</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Conclusión Final</DialogTitle>
                          <DialogDescription>Informe detallado para el cliente</DialogDescription>
                        </DialogHeader>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>
                            {data.conclusionParaCliente?.informe_de_conclusion || 'No disponible'}
                          </ReactMarkdown>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
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


