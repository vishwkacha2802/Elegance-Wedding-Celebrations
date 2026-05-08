import { useState, type ChangeEvent, type FormEvent } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Textarea } from "@/react-app/components/ui/textarea";
import { Label } from "@/react-app/components/ui/label";
import { Card, CardContent } from "@/react-app/components/ui/card";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import { createContactInquiry } from "@/react-app/services/contactApi";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  eventDate: "",
  guestCount: "",
  venue: "",
  message: "",
};

export default function ContactPage() {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      await createContactInquiry(formData);
      setIsSubmitted(true);
      setFormData(initialFormData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit your inquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Us",
      lines: ["C.G Road", "Gujarat, India"],
    },
    {
      icon: Phone,
      title: "Call Us",
      lines: ["+91 9684512365", "+91 8546521236"],
    },
    {
      icon: Mail,
      title: "Email Us",
      lines: ["supprot.elegancewedding@gmail.com.com", "bookings@eleganceweddings.com"],
    },
    {
      icon: Clock,
      title: "Office Hours",
      lines: ["Mon - Fri: 9am - 6pm", "Sat: 10am - 4pm"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section
        className="relative flex h-[60vh] items-center justify-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative px-4 text-center">
          <p className="mb-3 text-sm uppercase tracking-wider text-white/80">Let's Connect</p>
          <h1 className="text-4xl font-script text-white sm:text-5xl lg:text-6xl">Contact Us</h1>
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {contactInfo.map((info) => (
              <Card key={info.title} className="border-none text-center shadow-md">
                <CardContent className="p-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mauve/10">
                    <info.icon className="h-6 w-6 text-mauve" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{info.title}</h3>
                  {info.lines.map((line) => (
                    <p key={line} className="text-sm text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-wider text-mauve">
                Get in Touch
              </p>
              <h2 className="mb-6 text-3xl font-script text-foreground sm:text-4xl">
                Tell Us About Your Dream Wedding
              </h2>
              <p className="mb-8 text-muted-foreground">
                We'd love to hear about your vision. Fill out the form below and one of our wedding
                specialists will get back to you within 24 hours.
              </p>

              {isSubmitted ? (
                <Card className="border-none bg-mauve/5 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mauve/10">
                      <CheckCircle className="h-8 w-8 text-mauve" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-foreground">
                      Thank You for Reaching Out!
                    </h3>
                    <p className="text-muted-foreground">
                      We've received your inquiry and will get back to you within 24 hours. In the
                      meantime, feel free to browse our portfolio.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {submitError ? (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {submitError}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="border-border focus:border-mauve"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="border-border focus:border-mauve"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="border-border focus:border-mauve"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventDate">Wedding Date</Label>
                      <Input
                        id="eventDate"
                        name="eventDate"
                        type="date"
                        value={formData.eventDate}
                        onChange={handleChange}
                        className="border-border focus:border-mauve"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="guestCount">Estimated Guest Count</Label>
                      <Input
                        id="guestCount"
                        name="guestCount"
                        placeholder="e.g., 150-200"
                        value={formData.guestCount}
                        onChange={handleChange}
                        className="border-border focus:border-mauve"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venue">Preferred Venue/Location</Label>
                      <Input
                        id="venue"
                        name="venue"
                        placeholder="e.g., Garden, Ballroom, Beach"
                        value={formData.venue}
                        onChange={handleChange}
                        className="border-border focus:border-mauve"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Tell Us About Your Vision *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={5}
                      placeholder="Share your wedding dreams, style preferences, and any specific requirements..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="resize-none border-border focus:border-mauve"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-magenta text-white hover:bg-magenta/90 sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            <div className="relative hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80"
                alt="Wedding consultation"
                className="h-full w-full rounded-lg object-cover shadow-xl"
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <p className="text-2xl font-script text-white">
                  "Every love story is beautiful, but yours should be uniquely told."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative h-96 bg-muted">
        <div className="absolute inset-0 flex items-center justify-center bg-blush">
          <div className="text-center">
            <MapPin className="mx-auto mb-4 h-12 w-12 text-mauve" />
            <p className="text-muted-foreground">Interactive map would be displayed here</p>
            <p className="mt-2 text-sm text-muted-foreground">
              123 Wedding Lane, Suite 100, New York, NY 10001
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
