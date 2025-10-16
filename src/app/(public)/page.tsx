import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, CheckCircle, Zap } from 'lucide-react';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

  const features = [
    {
      title: 'Multi-Chain Dashboard',
      description: 'View all your assets from different blockchains in one single place.',
    },
    {
      title: 'Secure Wallet Connection',
      description: 'Connect with MetaMask, WalletConnect, and more with enterprise-grade security.',
    },
    {
      title: 'Real-Time Analytics',
      description: 'Track your portfolio performance with up-to-the-second data and insights.',
    },
    {
      title: 'Intuitive UX',
      description: 'A beautifully designed interface that makes DeFi accessible to everyone.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">AndeChain Nexus</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Login
          </Link>
          <Button asChild>
            <Link href="/dashboard">Launch App</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover -z-10 opacity-10"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                The Future of Decentralized Finance
              </h1>
              <p className="text-lg text-muted-foreground">
                AndeChain Nexus provides a powerful, secure, and user-friendly platform to manage your DeFi portfolio across multiple chains.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    Get Started <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                  Key Features
                </div>
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
                    <CheckCircle className="w-5 h-5" />
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
