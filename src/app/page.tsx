import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  Code,
  Database,
  Globe,
  Palette,
  Shield,
  Zap,
} from "lucide-react";

export default function Home() {
  const requirements = [
    {
      icon: Shield,
      title: "Auth Gate",
      description: "Protect all routes with HTTP Basic auth",
    },
    {
      icon: Palette,
      title: "UI Kit",
      description: "Use shadcn/ui with idiomatic patterns",
    },
    {
      icon: Database,
      title: "API Integration",
      description: "Integrate with public APIs, show 2+ endpoints",
    },
    {
      icon: Code,
      title: "Data Logic",
      description: "Implement business logic with unit tests",
    },
    {
      icon: Globe,
      title: "Production Ready",
      description: "Type-safe, linted, deployed to Vercel",
    },
    {
      icon: Zap,
      title: "AI-Assisted",
      description: "Document your AI workflow sessions",
    },
  ];

  const suggestedAPIs = [
    {
      name: "PokéAPI",
      url: "https://pokeapi.co/",
      use: "Rich nested data, pagination demos",
    },
    {
      name: "Studio Ghibli",
      url: "https://ghibliapi.vercel.app/",
      use: "Film catalogue relations",
    },
    {
      name: "REST Countries",
      url: "https://restcountries.com/v3.1/",
      use: "Geo data and filtering",
    },
  ];

  return (
    <div className="from-background to-muted/50 min-h-screen bg-gradient-to-br">
      <div className="container mx-auto max-w-6xl px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <Badge variant="secondary" className="mb-4">
            <Clock className="mr-2 h-4 w-4" />
            Maximum 1 Working Day
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Senior Full-Stack Developer
          </h1>
          <p className="text-muted-foreground mb-2 text-xl">
            Take-Home Technical Exercise
          </p>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Demonstrate your ability to rapidly bootstrap, structure, and polish
            a production-grade web application while leveraging AI-assisted
            workflows.
          </p>
        </div>

        {/* Tech Stack */}
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-primary text-3xl font-bold">
                Next.js 15
              </CardTitle>
              <CardDescription>
                App Router + TypeScript + Tailwind CSS
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-primary text-3xl font-bold">
                shadcn/ui
              </CardTitle>
              <CardDescription>
                Pre-configured Components + Styling
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Core Requirements */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Core Requirements
            </CardTitle>
            <CardDescription>
              Focus on clarity of thought, code quality, and polished UX over
              raw feature volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {requirements.map((req, index) => (
                <Card key={index}>
                  <CardContent className="flex items-start gap-3">
                    <req.icon className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                    <div>
                      <h3 className="mb-1 font-medium">{req.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {req.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Suggested APIs */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Suggested Public APIs</CardTitle>
            <CardDescription>
              Choose one to integrate (or suggest another that better showcases
              your skills)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {suggestedAPIs.map((api, index) => (
                <Card
                  key={index}
                  className="hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  <CardContent>
                    <h3 className="mb-2 font-medium">{api.name}</h3>
                    <p className="text-muted-foreground mb-2 text-sm">
                      {api.use}
                    </p>
                    <a
                      href={api.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline"
                    >
                      {api.url}
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Repository Setup</CardTitle>
            <CardDescription>
              Everything is pre-configured and ready to go. Start building your
              solution immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="bg-muted/50">
                  <CardContent>
                    <h4 className="mb-2 flex items-center gap-2 font-medium">
                      <Code className="h-4 w-4" />
                      Pre-installed
                    </h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Next.js 15 with App Router</li>
                      <li>• TypeScript configuration</li>
                      <li>• Tailwind CSS setup</li>
                      <li>• shadcn/ui components</li>
                      <li>• ESLint + Prettier</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent>
                    <h4 className="mb-2 flex items-center gap-2 font-medium">
                      <Zap className="h-4 w-4" />
                      Quick Start
                    </h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      <li>• Clone this repository</li>
                      <li>
                        • Run{" "}
                        <code className="bg-background rounded px-1">
                          npm install
                        </code>
                      </li>
                      <li>
                        • Start with{" "}
                        <code className="bg-background rounded px-1">
                          npm run dev
                        </code>
                      </li>
                      <li>• Pushes deploy to Vercel automatically</li>
                      <li>• Check component examples in /components/ui</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                <h4 className="mb-2 font-medium">Need Help?</h4>
                <p className="text-muted-foreground text-sm">
                  You&apos;ll be invited to a <strong>Slack channel</strong>{" "}
                  where you can ask clarifying questions and collaborate with
                  our team. Don&apos;t hesitate to reach out if you need
                  guidance!
                </p>
              </div>

              <div className="border-primary/20 bg-primary/5 rounded-lg border p-4">
                <p className="text-sm">
                  <strong>Focus:</strong> We value iterative thinking and clear
                  communication over perfection. Show us your thought process
                  and how you approach problems. Good luck! 🚀
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
