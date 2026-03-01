import TopNav from "@/components/app/TopNav";
import Card from "@/components/ui/Card";
import { dataProvider } from "@/data";

const DAILY_WORKFLOW = [
  "Read 5 KPI cards and regime quadrant position.",
  "Scan rates/curve + credit stress panel for red flags.",
  "Check cross-asset heatmap for confirmation/divergence.",
  "Read the 'what changed' summary.",
];

const WEEKLY_WORKFLOW = [
  "Review each composite's contributor breakdown.",
  "Identify two confirming and two contradicting signals.",
  "Update base case and alternative risk case.",
];

const MONTHLY_WORKFLOW = [
  "Recompute and lock monthly regime snapshot.",
  "Compare thesis vs realized market reaction.",
  "Update regime probabilities and invalidation triggers.",
];

export default async function LearnPage() {
  const data = await dataProvider.getDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Learn</h1>
          <p className="text-sm text-text-muted">Interpretation notes and workflow scripts from the plan.</p>
        </div>

        <TopNav />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="Daily 5-Minute Check">
            <ol className="list-decimal space-y-2 pl-4 text-sm text-text-secondary">
              {DAILY_WORKFLOW.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </Card>

          <Card title="Weekly 30-Min Dive">
            <ol className="list-decimal space-y-2 pl-4 text-sm text-text-secondary">
              {WEEKLY_WORKFLOW.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </Card>

          <Card title="Monthly Regime Review">
            <ol className="list-decimal space-y-2 pl-4 text-sm text-text-secondary">
              {MONTHLY_WORKFLOW.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </Card>
        </div>

        <Card title="Educational Notes">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.educationalNotes.map((note) => (
              <div key={note.sectionId} className="rounded-md border border-border bg-surface-elevated p-3">
                <h3 className="text-sm font-medium text-text-primary">{note.title}</h3>
                <p className="mt-2 text-xs text-text-muted">Why it matters</p>
                <p className="text-sm text-text-secondary">{note.whyItMatters}</p>
                <p className="mt-2 text-xs text-text-muted">How to interpret</p>
                <p className="text-sm text-text-secondary">{note.howToInterpret}</p>
                <p className="mt-2 text-xs text-text-muted">Pitfall</p>
                <p className="text-sm text-text-secondary">{note.pitfall}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
