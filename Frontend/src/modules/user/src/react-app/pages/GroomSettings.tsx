import { Gem, Home, Settings } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@user/react-app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@user/react-app/components/ui/card";
import { Checkbox } from "@user/react-app/components/ui/checkbox";
import { Label } from "@user/react-app/components/ui/label";

export default function GroomSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-champagne/30 via-background to-blush/20">
      <header className="border-b border-gold/20 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-rose">
              <Gem className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">Groom Settings</p>
              <p className="text-xs text-muted-foreground">Manage account preferences</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link to="/groom">
              <Button variant="outline" size="sm">Back to Dashboard</Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Card className="border-gold/20 shadow-lg shadow-gold/5">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Settings className="w-5 h-5 text-gold" />
              Preferences
            </CardTitle>
            <CardDescription>Choose how you want to receive planning updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-gold/20 p-4">
              <Checkbox id="groom-email-updates" />
              <Label htmlFor="groom-email-updates">Email me vendor recommendations</Label>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-gold/20 p-4">
              <Checkbox id="groom-budget-alerts" />
              <Label htmlFor="groom-budget-alerts">Send alerts when selections exceed budget</Label>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-gold/20 p-4">
              <Checkbox id="groom-reminders" />
              <Label htmlFor="groom-reminders">Receive weekly planning reminders</Label>
            </div>
            <Button className="bg-gradient-to-r from-gold to-rose text-white hover:opacity-90">
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

