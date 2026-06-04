type AIFeedbackProps = {
  feedback: string[];
};

export function AIFeedback({ feedback }: AIFeedbackProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
      <h3 className="text-xl font-semibold text-white">AI Feedback</h3>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
        {feedback.map((line) => (
          <li key={line} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
