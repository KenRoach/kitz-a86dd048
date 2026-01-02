import { X, MessageCircle, DollarSign, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CustomerProfileProps {
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    lifecycle: "lead" | "active" | "repeat";
    totalSpent: string;
    orders: number;
    lastInteraction: string;
    tags: string[];
    history: Array<{
      id: string;
      type: "message" | "purchase" | "note";
      content: string;
      date: string;
    }>;
  };
  onClose: () => void;
}

const historyIcons = {
  message: MessageCircle,
  purchase: ShoppingBag,
  note: DollarSign,
};

const historyColors = {
  message: "bg-primary/10 text-primary",
  purchase: "bg-success/10 text-success",
  note: "bg-muted text-muted-foreground",
};

export function CustomerProfile({ customer, onClose }: CustomerProfileProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-lg z-50 animate-slide-in overflow-auto">
      <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{customer.name}</h2>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">{customer.totalSpent}</p>
            <p className="text-xs text-muted-foreground mt-1">Total spent</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">{customer.orders}</p>
            <p className="text-xs text-muted-foreground mt-1">Orders</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold text-foreground capitalize">{customer.lifecycle}</p>
            <p className="text-xs text-muted-foreground mt-1">Status</p>
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {customer.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm bg-accent text-accent-foreground rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* AI Suggestion */}
        <div className="bg-accent/50 rounded-xl p-4 border border-accent">
          <p className="text-sm text-foreground">
            <span className="font-medium">Suggested:</span> Follow up about their last order
          </p>
          <Button variant="secondary" size="sm" className="mt-3">
            Send message
          </Button>
        </div>

        {/* History */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4">History</h3>
          <div className="space-y-4">
            {customer.history.map((item) => {
              const Icon = historyIcons[item.type];
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", historyColors[item.type])}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
