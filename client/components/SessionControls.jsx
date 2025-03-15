import React, { useState } from "react";
import { CloudLightning, CloudOff, MessageSquare } from "react-feather";
import Button from "./Button";
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
} from "../components/ui/alert-dialog";

export default function SessionControls({
  startSession,
  stopSession,
  sendClientEvent,
  sendTextMessage,
  serverEvents,
  isSessionActive,
}) {
  return (
    <div className="flex gap-4 border-t-2 border-gray-200 h-full rounded-md relative z-20">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            onClick={stopSession}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            End Session
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                stopSession();
                setTimeout(() => {
                  const confirmDialog = document.createElement('div');
                  confirmDialog.innerHTML = `
                    <div class="fixed inset-0 bg-black/50 flex items-center justify-center">
                      <div class="bg-white p-6 rounded-lg shadow-xl">
                        <h2 class="text-xl font-bold mb-4">Session Ended</h2>
                        <p class="mb-4">Would you like to review your feedback now?</p>
                        <div class="flex justify-end gap-4">
                          <button
                            class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            onclick="this.closest('.fixed').remove()"
                          >Close</button>
                          <button
                            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onclick="(() => {
                                  this.closest('.fixed').remove();
                                  const event = new CustomEvent('navigateToReview');
                                  window.dispatchEvent(event);
                                })()"
                          >Review Feedback</button>
                        </div>
                      </div>
                    </div>
                  `;
                  document.body.appendChild(confirmDialog);
                }, 500);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}