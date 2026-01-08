import { WeeklyReview } from "@/components/autopilot/WeeklyReview";
import { SwotAnalysis } from "@/components/autopilot/SwotAnalysis";
import { EisenhowerMatrix } from "@/components/autopilot/EisenhowerMatrix";
import { ContentCalendar } from "@/components/autopilot/ContentCalendar";
import { ProjectGantt } from "@/components/autopilot/ProjectGantt";

export function ProductivityTab() {
  return (
    <div className="space-y-6">
      {/* Calendar and Gantt side by side on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ContentCalendar />
        <ProjectGantt />
      </div>
      
      {/* Weekly Review */}
      <WeeklyReview />
      
      {/* Eisenhower Matrix - full width */}
      <EisenhowerMatrix />
      
      {/* SWOT Analysis */}
      <SwotAnalysis />
    </div>
  );
}
