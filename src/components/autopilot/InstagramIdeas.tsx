import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import {
  Instagram,
  Sparkles,
  Loader2,
  Image,
  Video,
  Layers,
  Film,
  Clock,
  Copy,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PostIdea {
  title: string;
  description: string;
  hashtags: string[];
  bestTime: "morning" | "afternoon" | "evening";
  contentType: "photo" | "video" | "carousel" | "reel" | "story";
}

interface InstagramIdeasProps {
  businessType?: string;
  businessName?: string;
}

const contentTypeIcons = {
  photo: Image,
  video: Video,
  carousel: Layers,
  reel: Film,
  story: Clock,
};

const timeIcons = {
  morning: Sun,
  afternoon: Sunset,
  evening: Moon,
};

const contentTypeLabels = {
  photo: "Photo",
  video: "Video",
  carousel: "Carousel",
  reel: "Reel",
  story: "Story",
};

export function InstagramIdeas({ businessType, businessName }: InstagramIdeasProps) {
  const { language } = useLanguage();
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState("");

  const generateIdeas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("instagram-ideas", {
        body: { businessType, businessName, mood: mood || undefined },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setIdeas(data.ideas || []);
      toast.success(language === "es" ? "¡Ideas generadas!" : "Ideas generated!");
    } catch (error: any) {
      console.error("Error generating ideas:", error);
      toast.error(error.message || (language === "es" ? "Error al generar ideas" : "Failed to generate ideas"));
    } finally {
      setLoading(false);
    }
  };

  const copyHashtags = (hashtags: string[]) => {
    const text = hashtags.map((h) => `#${h}`).join(" ");
    navigator.clipboard.writeText(text);
    toast.success(language === "es" ? "Hashtags copiados" : "Hashtags copied");
  };

  const copyIdea = (idea: PostIdea) => {
    const text = `${idea.title}\n\n${idea.description}\n\n${idea.hashtags.map((h) => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    toast.success(language === "es" ? "Idea copiada" : "Idea copied");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Instagram className="h-5 w-5 text-pink-500" />
            {language === "es" ? "Ideas de Contenido" : "Content Ideas"}
          </CardTitle>
          {ideas.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={generateIdeas}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ideas.length === 0 ? (
          <div className="space-y-3">
            <Input
              placeholder={language === "es" ? "Tema o estado de ánimo (opcional)..." : "Theme or mood (optional)..."}
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            />
            <Button
              onClick={generateIdeas}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {language === "es" ? "Generar Ideas para Hoy" : "Generate Today's Ideas"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {language === "es"
                ? "Ideas simples y auténticas para tu negocio"
                : "Simple, authentic ideas for your business"}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-3">
              {ideas.map((idea, index) => {
                const ContentIcon = contentTypeIcons[idea.contentType];
                const TimeIcon = timeIcons[idea.bestTime];

                return (
                  <div
                    key={index}
                    className="p-3 rounded-xl border bg-card hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm">{idea.title}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyIdea(idea)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3">
                      {idea.description}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <ContentIcon className="h-3 w-3" />
                        {contentTypeLabels[idea.contentType]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <TimeIcon className="h-3 w-3" />
                        {idea.bestTime}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {idea.hashtags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] text-pink-600 dark:text-pink-400"
                          >
                            #{tag}
                          </span>
                        ))}
                        {idea.hashtags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{idea.hashtags.length - 3}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => copyHashtags(idea.hashtags)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {language === "es" ? "Hashtags" : "Hashtags"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
