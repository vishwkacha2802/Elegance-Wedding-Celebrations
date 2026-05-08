import { Crown, Home, Settings } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@user/react-app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@user/react-app/components/ui/card";
import { Checkbox } from "@user/react-app/components/ui/checkbox";
import { Label } from "@user/react-app/components/ui/label";

export default function BrideSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blush/30 via-background to-champagne/20">
      <header className="sticky top-0 z-50 border-b border-rose/20 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose to-gold">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">Bride Settings</p>
              <p className="text-xs text-muted-foreground">Manage account preferences</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link to="/bride">
              <Button variant="outline" size="sm">Back to Dashboard</Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Card className="border-rose/20 shadow-lg shadow-rose/5">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Settings className="h-5 w-5 text-rose" />
              Preferences
            </CardTitle>
            <CardDescription>Choose how you want to receive planning updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-rose/20 p-4">
              <Checkbox id="bride-email-updates" />
              <Label htmlFor="bride-email-updates">Email me vendor recommendations</Label>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-rose/20 p-4">
              <Checkbox id="bride-budget-alerts" />
              <Label htmlFor="bride-budget-alerts">Send alerts when selections exceed budget</Label>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-rose/20 p-4">
              <Checkbox id="bride-reminders" />
              <Label htmlFor="bride-reminders">Receive weekly planning reminders</Label>
            </div>
            <Button className="bg-gradient-to-r from-rose to-gold text-white hover:opacity-90">
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
