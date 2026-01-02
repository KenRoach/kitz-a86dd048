import { X, MessageCircle, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CustomerProfileProps {
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    lifecycle: "lead" | "active" | "repeat";
    total_spent: number;
    orders: number;
    last_interaction: string;
    tags: string[];
    history?: Array<{
      id: string;
      type: "message" | "purchase" | "note";
      content: string;
      date: string;
    }>;
  };
  onClose: () => void;
}

const lifecycleColors = {
  lead: "bg-muted text-muted-foreground",
  active: "bg-primary/10 text-primary",
  repeat: "bg-success/10 text-success",
};

export function CustomerProfile({ customer, onClose }: CustomerProfileProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-lg z-50 animate-slide-in overflow-auto">
      <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{customer.name}</h2>
          {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
          {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">${customer.total_spent.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total spent</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">{customer.orders}</p>
            <p className="text-xs text-muted-foreground mt-1">Orders</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className={cn("text-lg font-semibold capitalize", lifecycleColors[customer.lifecycle].replace("bg-", "text-").split(" ")[0])}>
              {customer.lifecycle}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Status</p>
          </div>
        </div>

        {/* Tags */}
        {customer.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {customer.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 text-sm bg-accent text-accent-foreground rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Suggestion */}
        {customer.lifecycle !== "repeat" && (
          <div className="bg-accent/50 rounded-xl p-4 border border-accent">
            <p className="text-sm text-foreground">
              <span className="font-medium">Suggested:</span>{" "}
              {customer.lifecycle === "lead"
                ? "Send a welcome offer to convert this lead"
                : "Follow up to encourage repeat purchase"}
            </p>
            <Button variant="secondary" size="sm" className="mt-3">
              <MessageCircle className="w-4 h-4 mr-2" />
              Send message
            </Button>
          </div>
        )}

        {/* History placeholder */}
        {customer.history && customer.history.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-foreground mb-4">History</h3>
            <div className="space-y-4">
              {customer.history.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", item.type === "purchase" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                    {item.type === "purchase" ? <ShoppingBag className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty history */}
        {(!customer.history || customer.history.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Order history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
