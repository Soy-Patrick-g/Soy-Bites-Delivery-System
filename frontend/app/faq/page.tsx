import { StaticPageShell } from "@/components/StaticPageShell";
import { APP_NAME } from "@/lib/brand";

const questions = [
  {
    question: "How are delivery fees calculated?",
    answer: "Delivery fees are calculated from distance and the current platform delivery settings."
  },
  {
    question: "Can I order from multiple restaurants at once?",
    answer: `Yes. ${APP_NAME} supports combined checkout across multiple restaurants when items are added to one cart.`
  },
  {
    question: "When can I leave a review?",
    answer: "Reviews are available after an order is marked as delivered."
  }
];

export default function FaqPage() {
  return (
    <StaticPageShell
      eyebrow="FAQ"
      title="Answers to common questions"
      intro="A quick guide to ordering, delivery tracking, account access, and reviews."
    >
      {questions.map((item) => (
        <article key={item.question} className="surface-panel p-6">
          <h2 className="text-xl font-semibold text-ink">{item.question}</h2>
          <p className="mt-4 muted-copy">{item.answer}</p>
        </article>
      ))}
    </StaticPageShell>
  );
}
