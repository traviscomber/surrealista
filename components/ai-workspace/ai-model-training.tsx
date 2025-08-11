"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Brain, Database, Play, Pause, RotateCw, FileText, BarChart, Settings, Plus, Upload } from "lucide-react"

// Datos de ejemplo para modelos de IA
const models = [
  {
    id: 1,
    name: "PropertyClassifier-v2",
    description: "Modelo para clasificar propiedades según características y ubicación",
    status: "trained",
    accuracy: 92.5,
    lastTrained: "2024-01-15",
    datasetSize: 15000,
    type: "classification",
  },
  {
    id: 2,
    name: "PricePredictor-v3",
    description: "Modelo para predecir precios de propiedades basado en características y ubicación",
    status: "training",
    accuracy: 88.2,
    lastTrained: "2024-02-10",
    datasetSize: 12500,
    type: "regression",
    progress: 65,
  },
  {
    id: 3,
    name: "ClientSegmentation-v1",
    description: "Modelo para segmentar clientes según comportamiento y preferencias",
    status: "trained",
    accuracy: 85.7,
    lastTrained: "2023-12-05",
    datasetSize: 8000,
    type: "clustering",
  },
  {
    id: 4,
    name: "MarketTrendAnalyzer-v2",
    description: "Modelo para analizar y predecir tendencias del mercado inmobiliario",
    status: "evaluating",
    accuracy: 79.3,
    lastTrained: "2024-02-01",
    datasetSize: 10000,
    type: "time-series",
    progress: 90,
  },
  {
    id: 5,
    name: "PropertyDescriptionGenerator-v1",
    description: "Modelo para generar descripciones atractivas de propiedades",
    status: "draft",
    type: "nlg",
  },
]

// Datos de ejemplo para datasets
const datasets = [
  {
    id: 1,
    name: "Propiedades Sur de Chile 2023",
    description: "Dataset completo de propiedades en el sur de Chile con precios y características",
    records: 15000,
    lastUpdated: "2023-12-20",
    format: "CSV",
    size: "45MB",
  },
  {
    id: 2,
    name: "Transacciones Inmobiliarias 2022-2023",
    description: "Registro de transacciones inmobiliarias en los últimos 2 años",
    records: 8500,
    lastUpdated: "2023-11-15",
    format: "JSON",
    size: "32MB",
  },
  {
    id: 3,
    name: "Preferencias de Clientes",
    description: "Datos de preferencias y comportamiento de clientes en la plataforma",
    records: 12000,
    lastUpdated: "2024-01-10",
    format: "CSV",
    size: "28MB",
  },
]

export function AIModelTraining() {
  const [selectedTab, setSelectedTab] = useState("models")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "trained":
        return <Badge className="bg-green-500">Entrenado</Badge>
      case "training":
        return <Badge className="bg-blue-500">Entrenando</Badge>
      case "evaluating":
        return <Badge className="bg-amber-500">Evaluando</Badge>
      case "draft":
        return <Badge variant="outline">Borrador</Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Entrenamiento de Modelos IA</h2>
          <p className="text-gray-500">Gestiona, entrena y evalúa modelos de IA para mejorar las predicciones</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Modelo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="models" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="training">Nuevo Entrenamiento</TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <div className="grid grid-cols-1 gap-6">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        {model.name}
                      </CardTitle>
                      <CardDescription className="mt-1">{model.description}</CardDescription>
                    </div>
                    {getStatusBadge(model.status)}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {model.accuracy && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Precisión</p>
                        <div className="flex items-center gap-2">
                          <Progress value={model.accuracy} className="h-2" />
                          <span className="text-sm font-medium">{model.accuracy}%</span>
                        </div>
                      </div>
                    )}
                    {model.datasetSize && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tamaño del Dataset</p>
                        <p className="text-sm font-medium">{model.datasetSize.toLocaleString()} registros</p>
                      </div>
                    )}
                    {model.lastTrained && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Último Entrenamiento</p>
                        <p className="text-sm font-medium">{new Date(model.lastTrained).toLocaleDateString("es-ES")}</p>
                      </div>
                    )}
                  </div>

                  {model.status === "training" && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progreso del entrenamiento</span>
                        <span>{model.progress}%</span>
                      </div>
                      <Progress value={model.progress} className="h-2" />
                    </div>
                  )}

                  {model.status === "evaluating" && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progreso de evaluación</span>
                        <span>{model.progress}%</span>
                      </div>
                      <Progress value={model.progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{model.type}</Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <div className="flex gap-2">
                    {model.status === "training" || model.status === "evaluating" ? (
                      <Button variant="outline" size="sm">
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Ejecutar
                      </Button>
                    )}
                    {model.status === "trained" && (
                      <Button variant="outline" size="sm">
                        <RotateCw className="h-4 w-4 mr-2" />
                        Reentrenar
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <BarChart className="h-4 w-4 mr-2" />
                      Métricas
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="datasets">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {datasets.map((dataset) => (
              <Card key={dataset.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {dataset.name}
                  </CardTitle>
                  <CardDescription>{dataset.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Registros</p>
                      <p className="text-sm font-medium">{dataset.records.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Formato</p>
                      <p className="text-sm font-medium">{dataset.format}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tamaño</p>
                      <p className="text-sm font-medium">{dataset.size}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Última Actualización</p>
                      <p className="text-sm font-medium">{new Date(dataset.lastUpdated).toLocaleDateString("es-ES")}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Muestra
                  </Button>
                  <Button size="sm">
                    <Database className="h-4 w-4 mr-2" />
                    Usar Dataset
                  </Button>
                </CardFooter>
              </Card>
            ))}

            <Card className="border-dashed flex flex-col items-center justify-center p-6">
              <Database className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Agregar Nuevo Dataset</h3>
              <p className="text-gray-500 text-center mb-4">Sube un nuevo conjunto de datos para entrenar modelos</p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Subir Dataset
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Nuevo Entrenamiento</CardTitle>
              <CardDescription>
                Configura los parámetros para entrenar un nuevo modelo o reentrenar uno existente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model-type">Tipo de Modelo</Label>
                  <Select defaultValue="classification">
                    <SelectTrigger id="model-type">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classification">Clasificación</SelectItem>
                      <SelectItem value="regression">Regresión</SelectItem>
                      <SelectItem value="clustering">Clustering</SelectItem>
                      <SelectItem value="time-series">Series Temporales</SelectItem>
                      <SelectItem value="nlg">Generación de Lenguaje</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataset">Dataset</Label>
                  <Select defaultValue="1">
                    <SelectTrigger id="dataset">
                      <SelectValue placeholder="Selecciona un dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id.toString()}>
                          {dataset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model-name">Nombre del Modelo</Label>
                  <Input id="model-name" placeholder="Ej: PropertyClassifier-v3" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="training-split">División de Entrenamiento (%)</Label>
                  <Input id="training-split" type="number" min="50" max="90" defaultValue="80" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model-description">Descripción</Label>
                <Textarea id="model-description" placeholder="Describe el propósito y características del modelo" />
              </div>

              <div className="space-y-2">
                <Label>Opciones Avanzadas</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="cross-validation" />
                    <Label htmlFor="cross-validation">Validación cruzada</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="hyperparameter-tuning" />
                    <Label htmlFor="hyperparameter-tuning">Ajuste de hiperparámetros</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="feature-selection" />
                    <Label htmlFor="feature-selection">Selección de características</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="save-checkpoints" />
                    <Label htmlFor="save-checkpoints">Guardar checkpoints</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancelar</Button>
              <Button>Iniciar Entrenamiento</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
