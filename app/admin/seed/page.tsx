import { Button } from "@/components/ui/button"

export default function SeedPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Seed Database</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Seed Properties</h2>
        <p className="text-gray-600 mb-4">
          This will seed the database with sample properties. Use this for testing purposes only.
        </p>
        <Button>Seed Properties</Button>
      </div>
    </div>
  )
}
