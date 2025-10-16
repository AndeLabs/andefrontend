import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

  const features = [
    {
      title: 'Multi-Chain Dashboard',
      description: 'View all your assets from different blockchains in one single place.',
      icon: <CheckCircle className="w-5 h-5 text-primary" />,
    },
    {
      title: 'Secure Wallet Connection',
      description: 'Connect with MetaMask, WalletConnect, and more with enterprise-grade security.',
      icon: <CheckCircle className="w-5 h-5 text-primary" />,
    },
    {
      title: 'Real-Time Analytics',
      description: 'Track your portfolio performance with up-to-the-second data and insights.',
      icon: <CheckCircle className="w-5 h-5 text-primary" />,
    },
    {
      title: 'Intuitive UX',
      description: 'A beautifully designed interface that makes DeFi accessible to everyone.',
      icon: <CheckCircle className="w-5 h-5 text-primary" />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">AndeChain Nexus</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" asChild>
            <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
              Login
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Launch App</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(hsl(var(--muted))_1px,transparent_1px)]"></div>
          {heroImage && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
                <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                width={1200}
                height={600}
                className="object-cover opacity-5 dark:opacity-10"
                data-ai-hint={heroImage.imageHint}
                priority
                />
            </div>
          )}
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto space-y-4">
               <Badge variant="outline" className="py-1 px-3 text-sm">
                <Zap className="mr-2 h-4 w-4 text-primary" />
                Enterprise-Grade DeFi Platform
              </Badge>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-foreground/80 to-foreground">
                The Future of Decentralized Finance is Here
              </h1>
              <p className="text-lg text-muted-foreground">
                AndeChain Nexus provides a powerful, secure, and user-friendly platform to manage your DeFi portfolio across multiple chains.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    Launch App <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need for DeFi
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is packed with features designed for both beginners and professional traders.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-2 mt-12">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary p-3 rounded-full">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 AndeChain Nexus. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
