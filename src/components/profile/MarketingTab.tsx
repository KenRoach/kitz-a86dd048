import { InstagramIdeas } from "@/components/autopilot/InstagramIdeas";
import { ContentCalendar } from "@/components/autopilot/ContentCalendar";

export function MarketingTab() {
  return (
    <div className="space-y-6">
      {/* Content Calendar */}
      <ContentCalendar />
      
      {/* Instagram Ideas Generator */}
      <InstagramIdeas />
    </div>
  );
}
