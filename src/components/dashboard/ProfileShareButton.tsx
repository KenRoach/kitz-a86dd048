import { useState, useEffect } from "react";
import { Share2, Copy, Check, QrCode, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export function ProfileShareButton() {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.username) {
        setUsername(data.username);
      }
    };
    fetchUsername();
  }, [user]);

  if (!username) return null;

  const profileUrl = `${window.location.origin}/p/@${username}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Store",
          url: profileUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share Profile</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Your public profile</p>
            <p className="text-xs text-muted-foreground">Share this link with customers</p>
          </div>

          {/* URL display */}
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <span className="text-xs text-foreground truncate flex-1 font-mono">
              {profileUrl.replace("https://", "")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>

          {/* QR Code toggle */}
          {showQR && (
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCodeSVG value={profileUrl} size={120} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setShowQR(!showQR)}
            >
              <QrCode className="w-3.5 h-3.5" />
              {showQR ? "Hide QR" : "QR Code"}
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleShare}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Share
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
