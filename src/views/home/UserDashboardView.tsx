// src/views/home/UserDashboardView.tsx
type UserDashboardViewProps = {
  forecasts?: any[]; // you can replace `any[]` with your Forecast type later
};

export default function UserDashboardView({ forecasts = [] }: UserDashboardViewProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <p className="text-muted-foreground">
          View your upcoming forecasts and progress below.
        </p>
      </div>

      {forecasts.length > 0 ? (
        <ul className="space-y-2">
          {forecasts.map((forecast) => (
            <li
              key={forecast.id}
              className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition"
            >
              <h2 className="font-semibold">{forecast.title}</h2>
              <p className="text-sm text-muted-foreground">
                {forecast.organization?.name ?? "No organization"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No upcoming forecasts found.</p>
      )}
    </div>
  );
}
