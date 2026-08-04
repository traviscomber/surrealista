const areas = [
  {
    title: "Gestión territorial",
    description: "Ordena inventario, ubicación, documentación y contexto geográfico para cada propiedad.",
  },
  {
    title: "Gestión inmobiliaria",
    description: "Coordina búsqueda, clientes, comunicaciones, tareas y seguimiento de oportunidades.",
  },
  {
    title: "Arquitectura y proyectos",
    description: "Integra criterios de paisaje, uso, desarrollo y forma de habitar en la lectura del activo.",
  },
  {
    title: "Datos y tecnología",
    description: "Mantiene mapas, KMZ, roles y herramientas internas como apoyo a la operación profesional.",
  },
]

export function TeamSection() {
  return (
    <section className="sr-section-secondary border-t">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="sr-meta text-primary">Trabajo multidisciplinario</p>
            <h2 className="sr-section-title mt-3">Áreas que convergen en una misma operación.</h2>
          </div>

          <div className="grid border-t sm:grid-cols-2">
            {areas.map((area, index) => (
              <article
                key={area.title}
                className={`border-b py-7 sm:px-7 ${index % 2 === 1 ? "sm:border-l" : ""}`}
              >
                <h3 className="sr-panel-title">{area.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{area.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
