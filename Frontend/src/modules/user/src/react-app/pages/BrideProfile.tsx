import { Crown, Home, User } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@user/react-app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@user/react-app/components/ui/card";
import { Input } from "@user/react-app/components/ui/input";
import { Label } from "@user/react-app/components/ui/label";

export default function BrideProfile() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blush/30 via-background to-champagne/20">
      <header className="sticky top-0 z-50 border-b border-rose/20 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose to-gold">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">Bride Profile</p>
              <p className="text-xs text-muted-foreground">Manage your account details</p>
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
              <User className="h-5 w-5 text-rose" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your bride profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bride-first-name">First Name</Label>
                <Input id="bride-first-name" placeholder="e.g., Emily" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bride-last-name">Last Name</Label>
                <Input id="bride-last-name" placeholder="e.g., Johnson" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bride-email">Email</Label>
              <Input id="bride-email" type="email" placeholder="e.g., emily@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bride-phone">Phone</Label>
              <Input id="bride-phone" placeholder="e.g., +1 555 123 4567" />
            </div>
            <Button className="bg-gradient-to-r from-rose to-gold text-white hover:opacity-90">
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
