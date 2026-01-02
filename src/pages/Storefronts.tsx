import { AppLayout } from "@/components/layout/AppLayout";
import { StorefrontCard } from "@/components/storefront/StorefrontCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const storefronts = [
  {
    id: "1",
    title: "Chicken Bowl",
    description: "Grilled chicken with rice and vegetables",
    price: "$8.50",
    status: "shared" as const,
    link: "https://pay.businessos.io/chicken-bowl",
  },
  {
    id: "2",
    title: "Birthday Cupcakes",
    description: "12-pack vanilla cupcakes with custom decoration",
    price: "$36.00",
    status: "paid" as const,
    link: "https://pay.businessos.io/cupcakes",
  },
  {
    id: "3",
    title: "Weekly Meal Prep",
    description: "5 meals for the week — customer's choice",
    price: "$45.00",
    status: "draft" as const,
  },
  {
    id: "4",
    title: "Catering Package",
    description: "Full catering for events up to 50 people",
    price: "$350.00",
    status: "shared" as const,
    link: "https://pay.businessos.io/catering",
  },
];

export default function Storefronts() {
  const handleCreateStorefront = () => {
    toast.success("Creating new storefront...");
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Storefronts</h1>
            <p className="text-muted-foreground mt-1">Share links and get paid instantly.</p>
          </div>
          <Button onClick={handleCreateStorefront} className="gap-2">
            <Plus className="w-4 h-4" />
            New storefront
          </Button>
        </div>

        {/* Storefronts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {storefronts.map((storefront, index) => (
            <StorefrontCard
              key={storefront.id}
              {...storefront}
              delay={index * 100}
            />
          ))}
        </div>

        {/* AI Suggestion */}
        <div className="bg-accent/50 rounded-2xl p-6 border border-accent animate-fade-in" style={{ animationDelay: "400ms" }}>
          <p className="text-foreground">
            <span className="font-medium">Suggested:</span> Create a "Family Meal Bundle" based on your popular items
          </p>
          <button className="suggestion-pill mt-4">
            Create bundle — $52.00
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
