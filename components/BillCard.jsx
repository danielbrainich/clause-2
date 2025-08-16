import { Card, CardContent, CardHeader, Badge } from "./ui/Card";
import { Bookmark, Landmark } from "lucide-react";

export default function BillCard({ bill }) {
  const title = bill.title || bill.shortTitle || bill.number;
  const number = bill.number || bill.billNumber;
  const chamber = bill.chamber || bill.originChamber;
  const latest = bill.latestAction || bill.lastAction;
  const introduced = bill.introducedDate || bill.introduced;
  const stage =
    bill.status ||
    bill.stage ||
    (latest?.includes("Became Public Law") ? "Law" : "Active");

  const tone =
    stage === "Law" || latest?.includes("Became Public Law")
      ? "success"
      : latest?.includes("Introduced")
      ? "info"
      : "warning";

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight">{title}</h3>
          <Badge tone={tone}>{stage}</Badge>
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {number} · {chamber}
        </p>
      </CardHeader>
      <CardContent>
        {latest && <p className="text-sm leading-6">{latest}</p>}
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
          <div className="inline-flex items-center gap-1">
            <Landmark className="h-4 w-4" />
            <span>Introduced {introduced}</span>
          </div>
          <button
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1
                             hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <Bookmark className="h-4 w-4" />
            <span>Save</span>{" "}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
