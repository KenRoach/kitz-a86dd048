import { CheckCircle2 } from "lucide-react";
import { WorryDiagram } from "./WorryDiagram";

export function CalmState() {
  return (
    <div className="calm-state animate-fade-in space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-xl font-medium text-foreground">All caught up</h3>
        <p className="text-muted-foreground mt-2">Business is calm. Enjoy the moment.</p>
      </div>
      
      <WorryDiagram />
    </div>
  );
}
