import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function seedProperties() {
  const properties = [
    {
      title: "Casa Frente al Lago Llanquihue",
      description: "Hermosa casa con vista panorámica al lago",
      price: 450000000,
      city: "Puerto Varas",
      region: "Los Lagos",
      bedrooms: 4,
      bathrooms: 3,
      area: 180,
      land_area: 1200,
      property_type: "house",
      featured: true,
    },
    {
      title: "Departamento Centro Pucón",
      description: "Moderno departamento en el corazón de Pucón",
      price: 280000000,
      city: "Pucón",
      region: "La Araucanía",
      bedrooms: 2,
      bathrooms: 2,
      area: 85,
      property_type: "apartment",
      featured: false,
    },
  ]

  const { data, error } = await supabase.from("properties").insert(properties).select()

  if (error) {
    console.error("Error seeding properties:", error)
    return
  }

  console.log("Successfully seeded properties:", data)
}

export async function seedUsers() {
  // This would typically be handled by Supabase Auth
  console.log("User seeding handled by Supabase Auth")
}

// Run seeds
if (require.main === module) {
  seedProperties()
    .then(() => console.log("Seeding completed"))
    .catch(console.error)
}
