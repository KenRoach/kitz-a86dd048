import { AppLayout } from "@/components/layout/AppLayout";
import { AdminSection } from "@/components/admin/AdminSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2, Package, Users, CreditCard } from "lucide-react";

export default function Admin() {
  const handleSave = () => {
    toast.success("Changes saved");
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
          <p className="text-muted-foreground mt-1">Business settings — set once, forget forever.</p>
        </div>

        {/* Sections */}
        <div className="grid gap-6">
          {/* Business Profile */}
          <AdminSection
            title="Business Profile"
            description="Your business name and contact information"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business name</Label>
                  <Input id="businessName" defaultValue="Maria's Bakery" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue="+1 555-0100" className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue="123 Main St, Miami, FL" className="mt-1.5" />
              </div>
              <Button onClick={handleSave}>Save changes</Button>
            </div>
          </AdminSection>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminSection
              title="Products & Services"
              description="Manage what you sell"
              onClick={() => toast.info("Opening products...")}
            />
            <AdminSection
              title="Team Members"
              description="Manage users and roles"
              onClick={() => toast.info("Opening team...")}
            />
          </div>

          {/* Billing */}
          <div className="bg-accent/30 rounded-2xl border border-accent p-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Pro Plan</h4>
                <p className="text-sm text-muted-foreground">$29/month • Renews Jan 15</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Unlimited storefronts, unlimited customers, priority support
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
