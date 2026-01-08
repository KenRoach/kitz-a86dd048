import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Plus, Trash2, Flame } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, differenceInDays, startOfDay } from "date-fns";

interface Habit {
  id: string;
  name: string;
  completedDates: string[];
  createdAt: string;
}

interface HabitData {
  habits: Habit[];
}

export function HabitTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newHabit, setNewHabit] = useState("");
  const todayKey = format(new Date(), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["habits", user?.id],
    queryFn: () => {
      const stored = localStorage.getItem(`habits_${user?.id}`);
      return stored ? (JSON.parse(stored) as HabitData) : { habits: [] };
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (habits: Habit[]) => {
      localStorage.setItem(`habits_${user?.id}`, JSON.stringify({ habits }));
      return { habits };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", user?.id] });
    },
  });

  const habits = data?.habits || [];

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: newHabit.trim(),
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    saveMutation.mutate([...habits, habit]);
    setNewHabit("");
  };

  const toggleHabit = (habitId: string) => {
    const updated = habits.map((h) => {
      if (h.id !== habitId) return h;
      const isCompleted = h.completedDates.includes(todayKey);
      return {
        ...h,
        completedDates: isCompleted
          ? h.completedDates.filter((d) => d !== todayKey)
          : [...h.completedDates, todayKey],
      };
    });
    saveMutation.mutate(updated);
  };

  const deleteHabit = (habitId: string) => {
    saveMutation.mutate(habits.filter((h) => h.id !== habitId));
  };

  const getStreak = (habit: Habit): number => {
    if (habit.completedDates.length === 0) return 0;
    
    const sortedDates = [...habit.completedDates]
      .map((d) => startOfDay(new Date(d)))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    let checkDate = startOfDay(new Date());

    // If not completed today, check from yesterday
    if (!habit.completedDates.includes(todayKey)) {
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (const date of sortedDates) {
      if (differenceInDays(checkDate, date) === 0) {
        streak++;
        checkDate = new Date(checkDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (differenceInDays(checkDate, date) > 0) {
        break;
      }
    }

    return streak;
  };

  const completedToday = habits.filter((h) =>
    h.completedDates.includes(todayKey)
  ).length;
  const progressPercent = habits.length > 0 ? (completedToday / habits.length) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Daily Habits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Daily Habits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Today's Progress</span>
            <span className="font-medium">
              {completedToday}/{habits.length}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Add new habit */}
        <div className="flex gap-2">
          <Input
            placeholder="Add a new habit..."
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHabit()}
          />
          <Button size="icon" onClick={addHabit} disabled={!newHabit.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Habits list */}
        <div className="space-y-2">
          {habits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No habits yet. Add your first daily habit above!
            </p>
          ) : (
            habits.map((habit) => {
              const isCompleted = habit.completedDates.includes(todayKey);
              const streak = getStreak(habit);
              
              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleHabit(habit.id)}
                  />
                  <span
                    className={`flex-1 ${
                      isCompleted ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {habit.name}
                  </span>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="h-4 w-4" />
                      <span className="text-sm font-medium">{streak}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteHabit(habit.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
