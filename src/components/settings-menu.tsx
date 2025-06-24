"use client";

import { useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings, Moon, Sun, Monitor, Upload, Link as LinkIcon, Trash2, BellDot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function SettingsMenu() {
  const { setTheme } = useTheme();
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          document.body.style.backgroundImage = `url('${dataUrl}')`;
          localStorage.setItem("userBackground", dataUrl);
          toast({ title: "Background updated!" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlApply = () => {
    if (imageUrl) {
        try {
            new URL(imageUrl);
            document.body.style.backgroundImage = `url('${imageUrl}')`;
            localStorage.setItem("userBackground", imageUrl);
            toast({ title: "Background updated!" });
        } catch (_) {
            toast({
                title: "Invalid URL",
                description: "Please enter a valid image URL.",
                variant: "destructive",
            });
        }
    }
  };

  const handleBackgroundReset = () => {
    document.body.style.backgroundImage = "";
    localStorage.removeItem("userBackground");
    toast({ title: "Background reset to default." });
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleEnableNotifications = async () => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        toast({
            title: "VAPID Key Missing",
            description: "The application is not configured for push notifications.",
            variant: "destructive",
        });
        return;
    }

    setIsSubscribing(true);
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        await Notification.requestPermission();
        const swRegistration = await navigator.serviceWorker.ready;
        const subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
        });

        console.log('User subscription:', subscription);
        
        // TODO: Send subscription to your backend server
        // The `subscription` object should be sent to and stored on your server
        // to send push notifications to this user later.
        // For example:
        // await fetch('/api/subscribe', {
        //   method: 'POST',
        //   body: JSON.stringify(subscription),
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        // });

        toast({ title: "Subscribed!", description: "You will now receive push notifications." });
      } catch (error) {
        console.error('Failed to subscribe the user: ', error);
        let description = "An unknown error occurred.";
        if(error instanceof Error) {
            if (error.name === 'NotAllowedError') {
                description = "You have denied push notification permissions.";
            } else {
                description = error.message;
            }
        }
        toast({ title: "Subscription Failed", description, variant: "destructive" });
      }
    } else {
        toast({ title: "Not Supported", description: "Push notifications are not supported by your browser.", variant: "destructive" });
    }
    setIsSubscribing(false);
  };

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full transition-colors hover:bg-accent hover:text-accent-foreground md:h-14 md:w-14">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Open Settings</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[425px] bg-card/80 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize the look and feel of the app.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTheme("light")}><Sun className="mr-2"/> Light</Button>
              <Button variant="outline" onClick={() => setTheme("dark")}><Moon className="mr-2"/> Dark</Button>
              <Button variant="outline" onClick={() => setTheme("system")}><Monitor className="mr-2"/> System</Button>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Custom Background</Label>
            <div className="flex gap-2">
               <Input 
                  placeholder="Enter image URL" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
               <Button onClick={handleUrlApply}><LinkIcon /></Button>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" className="w-full" onClick={handleUploadClick}>
                    <Upload className="mr-2"/> Upload from Device
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
                 <Button variant="destructive" size="icon" onClick={handleBackgroundReset}>
                    <Trash2 />
                </Button>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Notifications</Label>
            <Button variant="outline" className="w-full" onClick={handleEnableNotifications} disabled={isSubscribing}>
                <BellDot className="mr-2"/> Enable Push Notifications
            </Button>
            <p className="text-xs text-muted-foreground">
                Get notified when there are new quizzes or updates.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
