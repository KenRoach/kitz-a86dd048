import { DollarSign } from "lucide-react";

interface Earning {
  id: string;
  customer: string;
  amount: number;
  time: string;
}

interface EarningsTodayProps {
  earnings: Earning[];
  total: number;
}

export function EarningsToday({ earnings, total }: EarningsTodayProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">Earnings today</h3>
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-success" />
          <span className="text-2xl font-semibold text-foreground">${total.toFixed(2)}</span>
        </div>
      </div>
      
      {earnings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No payments yet today
        </p>
      ) : (
        <div className="space-y-3">
          {earnings.map((earning, index) => (
            <div
              key={earning.id}
              className="flex items-center justify-between py-2 animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div>
                <p className="text-sm font-medium text-foreground">{earning.customer}</p>
                <p className="text-xs text-muted-foreground">{earning.time}</p>
              </div>
              <span className="text-sm font-semibold text-success">
                +${earning.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
