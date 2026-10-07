import { FaithDashboard } from "@/components/FaithDashboard";

export const metadata = {
  title: "News & Daily Scripture",
  description: "Selected headlines from Kenya and Africa, alongside John 14:6 in the World English Bible.",
};

export default function NewsPage() {
  return (
    <main>
      <FaithDashboard />
    </main>
  );
}
