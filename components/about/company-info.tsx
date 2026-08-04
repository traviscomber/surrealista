const capabilities = [
  {
    title: "Corretaje de campos",
    description: "Organización de antecedentes, lectura territorial y seguimiento comercial para propiedades rurales.",
  },
  {
    title: "Proyectos y planes maestros",
    description: "Análisis del territorio, oportunidades de desarrollo y coordinación de información para decisiones de largo plazo.",
  },
  {
    title: "Arquitectura",
    description: "Una mirada integrada entre paisaje, forma de habitar, restricciones del lugar y propósito del proyecto.",
  },
]

const principles = [
  "La información territorial debe ser trazable y comprensible.",
  "El paisaje y el contexto pesan tanto como el activo inmobiliario.",
  "La tecnología debe reducir fricción, no reemplazar el criterio profesional.",
  "Cada propiedad requiere una lectura propia, no una ficha genérica.",
]

export function CompanyInfo() {
  return (
    <section className="sr-section">
      <div className="mx-auto max-w-[1320px] px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="sr-meta text-primary">Cómo trabajamos</p>
            <h2 className="sr-section-title mt-3">Una lectura integral del territorio.</h2>
          </div>
          <div className="space-y-5 text-muted-foreground">
            <p className="sr-body">
              Sur Realista combina gestión inmobiliaria, arquitectura e información geográfica para ordenar decisiones
              sobre campos, propiedades y proyectos. La prioridad es comprender el lugar antes de simplificarlo en una
              oferta comercial.
            </p>
            <p className="sr-body">
              La plataforma interna reúne mapas, KMZ, roles, documentos y seguimiento operativo para que el equipo pueda
              trabajar sobre una misma base de información.
            </p>
          </div>
        </div>

        <div className="mt-16 grid border-y md:grid-cols-3">
          {capabilities.map((capability, index) => (
            <article
              key={capability.title}
              className={`py-8 md:px-8 ${index > 0 ? "border-t md:border-l md:border-t-0" : ""}`}
            >
              <p className="sr-meta text-muted-foreground">0{index + 1}</p>
              <h3 className="sr-panel-title mt-4">{capability.title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{capability.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <h2 className="sr-section-title">Principios de trabajo</h2>
          <ol className="divide-y border-y">
            {principles.map((principle, index) => (
              <li key={principle} className="grid grid-cols-[2.5rem_1fr] gap-4 py-5">
                <span className="sr-meta text-primary">0{index + 1}</span>
                <p className="text-[15px] leading-7 text-foreground">{principle}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
