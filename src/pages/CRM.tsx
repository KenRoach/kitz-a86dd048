import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CustomerCard } from "@/components/crm/CustomerCard";
import { CustomerProfile } from "@/components/crm/CustomerProfile";
import { Search } from "lucide-react";

const customers = [
  {
    id: "1",
    name: "Ana Rodriguez",
    email: "ana@email.com",
    phone: "+1 555-0101",
    lastInteraction: "Ordered today",
    totalSpent: "$248.50",
    orders: 12,
    lifecycle: "repeat" as const,
    tags: ["VIP", "Weekly orders"],
    history: [
      { id: "1", type: "purchase" as const, content: "Chicken Bowl x2 — $17.00", date: "Today" },
      { id: "2", type: "message" as const, content: "Thanks for the quick delivery!", date: "Yesterday" },
      { id: "3", type: "purchase" as const, content: "Weekly Meal Prep — $45.00", date: "Last week" },
    ],
  },
  {
    id: "2",
    name: "Carlos Mendez",
    email: "carlos@email.com",
    phone: "+1 555-0102",
    lastInteraction: "Payment pending",
    totalSpent: "$86.00",
    orders: 5,
    lifecycle: "active" as const,
    tags: ["Pending payment"],
    history: [
      { id: "1", type: "purchase" as const, content: "Chicken Bowl — $8.50 (pending)", date: "Today" },
      { id: "2", type: "message" as const, content: "Can I pay later?", date: "Today" },
    ],
  },
  {
    id: "3",
    name: "Maria Santos",
    email: "maria@email.com",
    phone: "+1 555-0103",
    lastInteraction: "2 weeks ago",
    totalSpent: "$124.00",
    orders: 8,
    lifecycle: "active" as const,
    tags: ["Needs follow-up"],
    history: [
      { id: "1", type: "purchase" as const, content: "Birthday Cupcakes — $36.00", date: "2 weeks ago" },
      { id: "2", type: "message" as const, content: "They were delicious!", date: "2 weeks ago" },
    ],
  },
  {
    id: "4",
    name: "Sofia Martinez",
    email: "sofia@email.com",
    phone: "+1 555-0104",
    lastInteraction: "Just signed up",
    totalSpent: "$0",
    orders: 0,
    lifecycle: "lead" as const,
    tags: ["New"],
    history: [
      { id: "1", type: "message" as const, content: "Hi! Do you do catering?", date: "2 hours ago" },
    ],
  },
];

export default function CRM() {
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers[0] | null>(null);
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Your business memory — always up to date.</p>
        </div>

        {/* Search */}
        <div className="relative animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Customer List */}
        <div className="space-y-4">
          {filteredCustomers.map((customer, index) => (
            <CustomerCard
              key={customer.id}
              {...customer}
              delay={index * 100}
              onClick={() => setSelectedCustomer(customer)}
            />
          ))}
        </div>

        {/* Customer Profile Drawer */}
        {selectedCustomer && (
          <>
            <div
              className="fixed inset-0 bg-foreground/20 z-40"
              onClick={() => setSelectedCustomer(null)}
            />
            <CustomerProfile
              customer={selectedCustomer}
              onClose={() => setSelectedCustomer(null)}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
