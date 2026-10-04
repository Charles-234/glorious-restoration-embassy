import { AIChatbot } from "@/components/ai-chatbot";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/siteData";
import { MessageCircle, Lightbulb, BookOpen, Heart } from "lucide-react";


export const metadata = {
  title: `AI Chat — ${siteConfig.brandName}`,
  description: "Get spiritual guidance, sermon recommendations, and answers to your faith questions through our AI chat assistant."
};

const chatSuggestions = [
  {
    title: "Sermon Recommendations",
    description: "Ask for sermons on specific topics like healing, faith, or relationships",
    icon: BookOpen,
    example: "Show me sermons about spiritual growth"
  },
  {
    title: "Spiritual Guidance",
    description: "Get biblical advice and encouragement for your faith journey",
    icon: Lightbulb,
    example: "How can I find peace in difficult times?"
  },
  {
    title: "Prayer Requests",
    description: "Share your prayer needs and get comforting scripture references",
    icon: Heart,
    example: "Please pray for my family situation"
  },
  {
    title: "Church Information",
    description: "Get information about our ministries, events, and services",
    icon: MessageCircle,
    example: "What time are your Sunday services?"
  }
];


export default function ChatPage() {
  return (
    <main className="container space-y-14 py-24">
      <section className="space-y-6 text-center">
        <SectionHeading
          title="AI Spiritual Companion"
          subtitle="Get biblical guidance, sermon recommendations, and spiritual support"
        />
        <p className="mx-auto max-w-3xl text-base leading-8 text-muted-foreground">
          Our AI assistant is here to help you find answers from Scripture, get recommendations
          for sermons and resources, and provide spiritual encouragement based on biblical truth.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {chatSuggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <Card key={index} className="space-y-4 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{suggestion.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{suggestion.description}</p>
              <p className="text-xs text-muted-foreground/60 italic">&ldquo;{suggestion.example}&rdquo;</p>
            </Card>
          );
        })}
      </section>

      <section className="space-y-6">
        <AIChatbot />
        <div className="readable-surface rounded-[2rem] p-6 text-center text-sm text-muted-foreground">
          <p>
            <strong>Note:</strong> This AI assistant provides guidance based on biblical principles and church resources.
            For personal pastoral care, please contact our office directly.
          </p>
        </div>
      </section>
    </main>
  );
}
