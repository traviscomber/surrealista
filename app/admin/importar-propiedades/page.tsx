import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProcessPropertyUrls from "@/scripts/process-property-urls"
import SimplePropertyImporter from "@/scripts/simple-property-importer"
import ExtractPropertyData from "@/scripts/extract-property-data"
import CheckPropertyData from "@/scripts/check-property-data"

export default function ImportPropertiesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Importar Propiedades</h1>

      <Tabs defaultValue="extract">
        <TabsList className="mb-6">
          <TabsTrigger value="extract">Extraer Datos</TabsTrigger>
          <TabsTrigger value="check">Verificar Datos</TabsTrigger>
          <TabsTrigger value="simple">Importador Simple</TabsTrigger>
          <TabsTrigger value="process">Procesar URLs</TabsTrigger>
        </TabsList>

        <TabsContent value="extract">
          <ExtractPropertyData />
        </TabsContent>

        <TabsContent value="check">
          <CheckPropertyData />
        </TabsContent>

        <TabsContent value="simple">
          <SimplePropertyImporter />
        </TabsContent>

        <TabsContent value="process">
          <ProcessPropertyUrls />
        </TabsContent>
      </Tabs>
    </div>
  )
}
