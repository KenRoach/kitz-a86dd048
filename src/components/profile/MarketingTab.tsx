import { InstagramIdeas } from "@/components/autopilot/InstagramIdeas";
import { ContentCalendar } from "@/components/autopilot/ContentCalendar";
import { ImageGenerator } from "@/components/marketing/ImageGenerator";

export function MarketingTab() {
  return (
    <div className="space-y-6">
      {/* AI Image Generator */}
      <ImageGenerator />
      
      {/* Content Calendar */}
      <ContentCalendar />
      
      {/* Instagram Ideas Generator */}
      <InstagramIdeas />
    </div>
  );
}
