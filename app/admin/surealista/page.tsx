import { AppHeader } from "@/components/layout/app-header"
import { SurRealistaCurrentInventory } from "@/components/admin/surealista-current-inventory"

export default function SurRealistaInventoryPage() {
  return (
    <>
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <SurRealistaCurrentInventory />
      </main>
    </>
  )
}
