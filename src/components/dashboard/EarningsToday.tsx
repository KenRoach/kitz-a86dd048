import { TrendingUp, ArrowUpRight } from "lucide-react";

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
    <div className="neu-card-flat p-4 sm:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider">Today's Earnings</h3>
        <div className="flex items-center gap-1 text-success">
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
      
      {/* Big number */}
      <div className="mb-4 sm:mb-6">
        <span className="text-2xl sm:text-4xl font-bold text-foreground">
          ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        {earnings.length > 0 && (
          <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-success font-medium">
            +{earnings.length} order{earnings.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {earnings.length === 0 ? (
        <div className="py-4 sm:py-6 text-center rounded-xl bg-muted/50">
          <p className="text-xs sm:text-sm text-muted-foreground">No payments yet today</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Earnings will appear here</p>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {earnings.slice(0, 4).map((earning, index) => (
            <div
              key={earning.id}
              className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-muted/50 animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">{earning.customer}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{earning.time}</p>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-success shrink-0">
                +${earning.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}