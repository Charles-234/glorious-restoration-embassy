import { FaithDashboard } from "@/components/FaithDashboard";

export const metadata = {
  title: "News & Daily Scripture",
  description: "Attributed faith headlines from Christian news publishers, alongside a daily scripture.",
};

export default function NewsPage() {
  return (
    <main>
      <FaithDashboard />
    </main>
  );
}
