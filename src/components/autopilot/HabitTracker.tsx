import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Plus, Trash2, Flame } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, startOfDay } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Habit {
  id: string;
  name: string;
  completed_dates: string[];
  created_at: string;
}

const MAX_HABITS = 10;

export function HabitTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newHabit, setNewHabit] = useState("");
  const todayKey = format(new Date(), "yyyy-MM-dd");

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["habits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user?.id,
  });

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("habits").insert({
        user_id: user!.id,
        name,
        completed_dates: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", user?.id] });
      toast.success("Habit added!");
    },
    onError: () => toast.error("Failed to add habit"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, completed_dates }: { id: string; completed_dates: string[] }) => {
      const { error } = await supabase
        .from("habits")
        .update({ completed_dates })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", user?.id] });
      toast.success("Habit deleted");
    },
    onError: () => toast.error("Failed to delete habit"),
  });

  const addHabit = () => {
    if (!newHabit.trim()) return;
    if (habits.length >= MAX_HABITS) {
      toast.error(`Maximum ${MAX_HABITS} habits allowed`);
      return;
    }
    addMutation.mutate(newHabit.trim());
    setNewHabit("");
  };

  const toggleHabit = (habit: Habit) => {
    const isCompleted = habit.completed_dates.includes(todayKey);
    const newDates = isCompleted
      ? habit.completed_dates.filter((d) => d !== todayKey)
      : [...habit.completed_dates, todayKey];
    updateMutation.mutate({ id: habit.id, completed_dates: newDates });
  };

  // Memoized streak calculations
  const streaks = useMemo(() => {
    const getStreak = (habit: Habit): number => {
      if (habit.completed_dates.length === 0) return 0;

      const sortedDates = [...habit.completed_dates]
        .map((d) => startOfDay(new Date(d)))
        .sort((a, b) => b.getTime() - a.getTime());

      let streak = 0;
      let checkDate = startOfDay(new Date());

      if (!habit.completed_dates.includes(todayKey)) {
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

    return habits.reduce((acc, habit) => {
      acc[habit.id] = getStreak(habit);
      return acc;
    }, {} as Record<string, number>);
  }, [habits, todayKey]);

  const completedToday = habits.filter((h) =>
    h.completed_dates.includes(todayKey)
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
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {habits.length}/{MAX_HABITS}
          </span>
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
            disabled={habits.length >= MAX_HABITS}
          />
          <Button
            size="icon"
            onClick={addHabit}
            disabled={!newHabit.trim() || habits.length >= MAX_HABITS || addMutation.isPending}
          >
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
              const isCompleted = habit.completed_dates.includes(todayKey);
              const streak = streaks[habit.id] || 0;

              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleHabit(habit)}
                    disabled={updateMutation.isPending}
                  />
                  <span
                    className={`flex-1 ${
                      isCompleted ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {habit.name}
                  </span>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 text-destructive">
                      <Flame className="h-4 w-4" />
                      <span className="text-sm font-medium">{streak}</span>
                    </div>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete habit?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{habit.name}" and all its streak history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(habit.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
