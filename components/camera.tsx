"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { analyzeMedia } from "../actions/analyze-video";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CameraComponent() {
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaAnalysis, setMediaAnalysis] = useState<string | null>(null);
  const [showAnalyzePopup, setShowAnalyzePopup] = useState(false);
  const [capturedMediaData, setCapturedMediaData] = useState<string | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: mode === "video",
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        title: "Camera Error",
        description:
          "Failed to access the camera. Please check your permissions.",
        variant: "destructive",
      });
    }
  }, [mode]);

  const stopCamera = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream;
    const tracks = stream?.getTracks();
    tracks?.forEach((track) => track.stop());
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);

      // Convert canvas to base64
      const imageBase64 = canvas.toDataURL("image/jpeg").split(",")[1];
      setCapturedMediaData(imageBase64);
      setShowAnalyzePopup(true);

      canvas.toBlob(async (blob) => {
        if (blob) {
          // await saveFile(blob, "photo.png");
        }
      });
    }
  }, []);

  const startRecording = useCallback(() => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      await new Promise<void>((resolve) => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: "video/webm" });
            const buffer = await blob.arrayBuffer();
            const base64data = Buffer.from(buffer).toString("base64");
            setCapturedMediaData(base64data);
            setShowAnalyzePopup(true);
            // await saveFile(blob, "video.webm");
            chunksRef.current = [];
            resolve();
          };
        }
      });
    }
  }, []);

  const handleAnalyzeMedia = async () => {
    if (capturedMediaData) {
      setIsAnalyzing(true);
      try {
        const analysis = await analyzeMedia(mode, capturedMediaData);
        setMediaAnalysis(analysis);
        if (analysis.includes("not supported")) {
          toast({
            title: "Video Analysis Unavailable",
            description:
              "Video analysis is currently not supported. Please try with an image instead.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Analysis error:", error);
        toast({
          title: "Analysis Failed",
          description:
            "There was an error analyzing the media. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
    setShowAnalyzePopup(false);
  };

  const saveFile = async (blob: Blob, fileName: string) => {
    try {
      if ("showSaveFilePicker" in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "File",
              accept: { "application/octet-stream": [".png", ".webm"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast({
          title: "File Saved",
          description: "Your file has been saved successfully.",
        });
      } else {
        throw new Error("File System Access API not supported");
      }
    } catch (err) {
      console.warn("Error saving file with File System Access API:", err);
      console.log("Falling back to default download method");

      // Fallback to default download method
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "File Downloaded",
        description: "Your file has been downloaded successfully.",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center space-y-4 p-4">
        <Select onValueChange={(value: "photo" | "video") => setMode(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="photo">Photo</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-video bg-gray-200 rounded-lg"
        />
        <div className="flex space-x-2">
          <Button onClick={startCamera}>Start Camera</Button>
          <Button onClick={stopCamera}>Stop Camera</Button>
          {mode === "photo" ? (
            <Button onClick={capturePhoto}>Capture Photo</Button>
          ) : (
            <Button onClick={isRecording ? stopRecording : startRecording}>
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
          )}
        </div>
        {isAnalyzing && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <p>Analyzing {mode}...</p>
          </div>
        )}
        {mediaAnalysis && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg max-h-60 overflow-y-auto">
            <h3 className="font-semibold mb-2">
              {mode.charAt(0).toUpperCase() + mode.slice(1)} Analysis:
            </h3>
            <p className="whitespace-pre-wrap">{mediaAnalysis}</p>
          </div>
        )}
      </CardContent>
      <AlertDialog open={showAnalyzePopup} onOpenChange={setShowAnalyzePopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Analyze {mode.charAt(0).toUpperCase() + mode.slice(1)}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to analyze the captured {mode} using AI?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, thanks</AlertDialogCancel>
            <AlertDialogAction onClick={handleAnalyzeMedia}>
              Yes, analyze
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
