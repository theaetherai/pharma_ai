"use client";

import { ChatInterface } from "@/components/chat-interface";
import { motion } from "framer-motion";

export default function ChatPage() {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">AI Medical Consultation</h1>
          <p className="text-muted-foreground">
            Describe your symptoms in detail to receive a personalized diagnosis and medication recommendations.
          </p>
        </div>
        
        <ChatInterface />
      </motion.div>
    </div>
  );
} 