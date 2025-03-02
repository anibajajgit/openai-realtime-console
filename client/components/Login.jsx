
import React from "react";
import LoginDialog from "./LoginDialog";

export default function Login({ isOpen, onClose, onLoginSuccess }) {
  return (
    <LoginDialog
      isOpen={isOpen}
      onClose={onClose}
      onLoginSuccess={onLoginSuccess}
    />
  );
}
