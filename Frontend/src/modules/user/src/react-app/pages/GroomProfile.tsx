import { Gem, Home, User } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@user/react-app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@user/react-app/components/ui/card";
import { Input } from "@user/react-app/components/ui/input";
import { Label } from "@user/react-app/components/ui/label";

export default function GroomProfile() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-champagne/30 via-background to-blush/20">
      <header className="border-b border-gold/20 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-rose">
              <Gem className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">Groom Profile</p>
              <p className="text-xs text-muted-foreground">Manage your account details</p>
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
              <User className="w-5 h-5 text-gold" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your groom profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="groom-first-name">First Name</Label>
                <Input id="groom-first-name" placeholder="e.g., James" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groom-last-name">Last Name</Label>
                <Input id="groom-last-name" placeholder="e.g., Carter" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="groom-email">Email</Label>
              <Input id="groom-email" type="email" placeholder="e.g., james@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groom-phone">Phone</Label>
              <Input id="groom-phone" placeholder="e.g., +1 555 987 6543" />
            </div>
            <Button className="bg-gradient-to-r from-gold to-rose text-white hover:opacity-90">
              Save Profile
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

