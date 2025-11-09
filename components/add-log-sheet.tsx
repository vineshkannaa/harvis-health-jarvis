'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Type, Loader2, X, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { IngestLogResponse } from '@/lib/types';

export function AddLogSheet({
  open,
  onOpenChange,
  onSuccess,
  onAddReminder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onAddReminder?: (text: string) => void;
}) {
  const [mode, setMode] = useState<'select' | 'text' | 'voice' | 'reminder'>('select');
  const [reminderText, setReminderText] = useState('');
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextSubmit = async () => {
    if (!text.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/logs/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });

      const data: IngestLogResponse = await response.json();
      if (data.success) {
        setText('');
        setMode('select');
        onOpenChange(false);
        onSuccess?.();
      } else {
        alert(data.error || 'Failed to log entry');
      }
    } catch (error) {
      console.error('Error submitting text log:', error);
      alert('Failed to submit log. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];

          setIsProcessing(true);
          try {
            const response = await fetch('/api/logs/ingest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Data,
                mime: 'audio/webm',
              }),
            });

            const data: IngestLogResponse = await response.json();
            if (data.success) {
              setMode('select');
              onOpenChange(false);
              onSuccess?.();
            } else {
              alert(data.error || 'Failed to process voice log');
            }
          } catch (error) {
            console.error('Error submitting voice log:', error);
            alert('Failed to process voice log. Please try again.');
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    setText('');
    setReminderText('');
    setMode('select');
    setRecordingTime(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add</DialogTitle>
          <DialogDescription>
            Log your health data or add a reminder
          </DialogDescription>
        </DialogHeader>

        {mode === 'select' && (
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => setMode('text')}
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
            >
              <Type className="size-6" />
              <span>Text Log</span>
            </Button>
            <Button
              onClick={() => setMode('voice')}
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
            >
              <Mic className="size-6" />
              <span>Voice Log</span>
            </Button>
            <Button
              onClick={() => setMode('reminder')}
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
            >
              <Bell className="size-6" />
              <span>Reminder</span>
            </Button>
          </div>
        )}

        {mode === 'text' && (
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="E.g., 'Had 150g paneer at lunch' or 'Ran 30 minutes'"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              disabled={isProcessing}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => setMode('select')}
                variant="outline"
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button
                onClick={handleTextSubmit}
                disabled={!text.trim() || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </div>
        )}

        {mode === 'voice' && (
          <div className="space-y-4 py-4">
            {!isRecording ? (
              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="size-20 rounded-full"
                  disabled={isProcessing}
                >
                  <Mic className="size-8" />
                </Button>
                <p className="text-sm text-muted-foreground">
                  Tap to start recording
                </p>
                <Button
                  onClick={() => setMode('select')}
                  variant="outline"
                  disabled={isProcessing}
                >
                  Back
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="size-24 rounded-full bg-destructive/20 flex items-center justify-center">
                    <div className="size-20 rounded-full bg-destructive flex items-center justify-center animate-pulse">
                      <Mic className="size-10 text-white" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-mono">
                    {formatTime(recordingTime)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recording... Tap to stop
                </p>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                  className="size-16 rounded-full"
                >
                  <X className="size-6" />
                </Button>
              </div>
            )}
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Processing audio...
              </div>
            )}
          </div>
        )}

        {mode === 'reminder' && (
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter reminder text..."
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && reminderText.trim()) {
                  onAddReminder?.(reminderText.trim());
                  setReminderText('');
                  setMode('select');
                  onOpenChange(false);
                }
              }}
              disabled={isProcessing}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => setMode('select')}
                variant="outline"
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  if (reminderText.trim()) {
                    onAddReminder?.(reminderText.trim());
                    setReminderText('');
                    setMode('select');
                    onOpenChange(false);
                  }
                }}
                disabled={!reminderText.trim() || isProcessing}
                className="flex-1"
              >
                Add Reminder
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

