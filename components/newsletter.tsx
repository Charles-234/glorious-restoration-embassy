"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, AlertCircle, Mail } from "lucide-react";
import { motion } from "framer-motion";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error" | "loading" | null; message?: string }>({ type: null });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!email.trim()) {
      setStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }
    
    if (!email.includes("@") || !email.includes(".")) {
      setStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setStatus({ type: "loading" });
    
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setStatus({ type: "error", message: result.error || "Failed to subscribe. Please try again." });
      } else {
        setStatus({ type: "success", message: "Thank you for subscribing! Check your email for confirmation." });
        setEmail("");
      }
    } catch (error) {
      setStatus({ type: "error", message: "Network error. Please check your connection." });
    }
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="readable-surface rounded-[2.5rem] p-6 md:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent sm:tracking-[0.32em]">Newsletter</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Stay connected with weekly inspiration.</h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">Subscribe to updates for livestream announcements, sermon summaries, and community stories from Glorious Restoration Embassy.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Enter your email address" 
              value={email} 
              onChange={(event) => {
                setEmail(event.target.value);
                if (status.type === "error") setStatus({ type: null });
              }} 
              type="email" 
              aria-label="Email address"
              className="pl-12"
              disabled={status.type === "loading"}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={status.type === "loading"}>
            {status.type === "loading" ? "Subscribing..." : "Subscribe"}
          </Button>
          
          {/* Status message */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: status.type ? 1 : 0, y: status.type ? 0 : -10 }}
            className="min-h-[24px]"
          >
            {status.type === "success" && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                <CheckCircle size={16} />
                <span>{status.message}</span>
              </div>
            )}
            {status.type === "error" && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={16} />
                <span>{status.message}</span>
              </div>
            )}
          </motion.div>
        </form>
      </div>
    </motion.section>
  );
}
