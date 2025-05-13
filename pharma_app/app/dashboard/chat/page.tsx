"use client";

import { ChatInterface } from "@/components/chat-interface";
import { motion } from "framer-motion";

export default function ChatPage() {
  return (
    <div className="w-full h-full dashboard-scroll-content">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full flex flex-col"
      >
        <div className="dashboard-page mb-2 flex-shrink-0">
          <h1 className="text-2xl font-bold mb-2">AI Medical Consultation</h1>
          <p className="text-muted-foreground">
            Describe your symptoms in detail to receive a personalized diagnosis and medication recommendations.
          </p>
        </div>
        
        <div className="w-full flex-1">
        <ChatInterface />
        </div>
      </motion.div>
    </div>
  );
} 