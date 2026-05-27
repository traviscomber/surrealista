import { BasicImage } from "@/components/ui/basic-image"

export function CompanyInfo() {
  return (
    <div className="mb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl font-bold mb-4">Nuestra Historia</h2>
          <p className="text-foreground/80 mb-4">
            Sur-Realista nació en 2015 con la visión de transformar el mercado inmobiliario en el sur de Chile,
            combinando el conocimiento local con tecnología de punta para ofrecer un servicio excepcional a nuestros
            clientes.
          </p>
          <p className="text-foreground/80 mb-4">
            Desde nuestros inicios, nos hemos especializado en propiedades únicas que capturan la esencia y belleza del
            sur de Chile, desde casas con vista al lago en Puerto Varas hasta parcelas en la Carretera Austral.
          </p>
          <p className="text-gray-700">
            Hoy, Sur-Realista es reconocida como la inmobiliaria líder en innovación tecnológica, ofreciendo
            herramientas como mapas interactivos, cotizador con IA y asistencia virtual para facilitar la búsqueda de
            propiedades a nuestros clientes.
          </p>
        </div>
        <div className="rounded-lg overflow-hidden shadow-lg">
          <BasicImage
            src="https://images.unsplash.com/photo-1577415124269-fc1140a69e91?auto=format&fit=crop&w=1170&q=80"
            alt="Oficina Sur-Realista"
            className="w-full h-auto"
          />
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card p-6 rounded-lg shadow-md">
          <div className="h-40 mb-4 rounded-md overflow-hidden">
            <BasicImage
              src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=500&q=80"
              alt="Misión"
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold mb-3">Misión</h3>
          <p className="text-gray-700">
            Conectar a las personas con propiedades excepcionales en el sur de Chile, brindando un servicio
            personalizado y utilizando tecnología innovadora para simplificar el proceso de compra, venta y arriendo.
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-md">
          <div className="h-40 mb-4 rounded-md overflow-hidden">
            <BasicImage
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=500&q=80"
              alt="Visión"
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold mb-3">Visión</h3>
          <p className="text-gray-700">
            Ser la inmobiliaria líder en el sur de Chile, reconocida por nuestra excelencia en servicio, innovación
            tecnológica y compromiso con el desarrollo sostenible de las comunidades donde operamos.
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-md">
          <div className="h-40 mb-4 rounded-md overflow-hidden">
            <BasicImage
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=500&q=80"
              alt="Valores"
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold mb-3">Valores</h3>
          <ul className="text-foreground/80 space-y-2">
            <li>• Excelencia en el servicio</li>
            <li>• Innovación constante</li>
            <li>• Transparencia y honestidad</li>
            <li>• Compromiso con la comunidad</li>
            <li>• Respeto por el medio ambiente</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
