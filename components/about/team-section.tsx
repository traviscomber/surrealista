import { BasicImage } from "@/components/ui/basic-image"

export function TeamSection() {
  const team = [
    {
      name: "Carlos Rodríguez",
      role: "Director General",
      bio: "Con más de 15 años de experiencia en el sector inmobiliario, Carlos fundó Sur-Realista con la visión de transformar la forma en que las personas encuentran propiedades en el sur de Chile.",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80",
    },
    {
      name: "María González",
      role: "Directora de Operaciones",
      bio: "María supervisa todas las operaciones diarias de Sur-Realista, asegurando que cada cliente reciba un servicio excepcional y personalizado.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80",
    },
    {
      name: "Javier Martínez",
      role: "Jefe de Tecnología",
      bio: "Javier lidera el desarrollo de nuestras herramientas tecnológicas, incluyendo el asistente IA y los mapas interactivos que hacen única a Sur-Realista.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&q=80",
    },
    {
      name: "Ana Soto",
      role: "Agente Senior",
      bio: "Con un profundo conocimiento del mercado inmobiliario del sur de Chile, Ana ha ayudado a cientos de clientes a encontrar su propiedad ideal.",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80",
    },
    {
      name: "Roberto Vega",
      role: "Especialista en Marketing",
      bio: "Roberto desarrolla estrategias innovadoras para promocionar nuestras propiedades y llegar a clientes potenciales en todo Chile y el extranjero.",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80",
    },
    {
      name: "Valentina Muñoz",
      role: "Asesora Financiera",
      bio: "Valentina ayuda a nuestros clientes a navegar por las complejidades financieras de la compra de propiedades, desde préstamos hasta impuestos.",
      image: "https://images.unsplash.com/photo-1598550880863-4e8aa3d0edb4?auto=format&fit=crop&w=500&q=80",
    },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Nuestro Equipo</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {team.map((member, index) => (
          <div
            key={index}
            className="bg-card rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="h-64 overflow-hidden">
              <BasicImage
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
              <p className="text-primary font-medium mb-3">{member.role}</p>
              <p className="text-foreground/80">{member.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
