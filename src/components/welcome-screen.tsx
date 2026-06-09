"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Leaf } from "lucide-react";

const sustainabilityQuotes = [
  "The future grows from the habits we choose today.",
  "Progress begins with one measured step.",
  "Small choices become powerful when they become consistent.",
  "A lighter footprint starts with clearer awareness.",
  "Care for the planet can fit inside an ordinary day.",
  "Every trip, meal, and switch can become a better choice.",
  "Sustainability is not perfection; it is direction.",
  "Measure what matters, then improve what you can.",
  "Cleaner habits are built one practical action at a time.",
  "A greener tomorrow begins with honest tracking today.",
  "The best climate plan is one you can actually follow.",
  "Awareness turns everyday routines into climate action.",
  "Reduce the invisible impact of ordinary moments.",
  "Smart choices become easier when your data is clear.",
  "Your footprint is a map, not a verdict.",
  "Better habits compound quietly.",
  "The most useful change is the one you repeat.",
  "Live lighter with data, intention, and patience.",
  "Sustainability starts where your daily life already is.",
  "When you understand your impact, improvement becomes possible.",
];

type WelcomeScreenProps = {
  onGetStarted: () => void;
};

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const [quote, setQuote] = useState(sustainabilityQuotes[0]);

  useEffect(() => {
    setQuote(sustainabilityQuotes[Math.floor(Math.random() * sustainabilityQuotes.length)]);
  }, []);

  return (
    <main className="welcome-shell">
      <section className="welcome-content" aria-labelledby="welcome-title">
        <div className="welcome-badge">
          <Leaf aria-hidden="true" className="h-4 w-4" />
          AI-Powered Sustainability Platform
        </div>

        <div className="welcome-copy">
          <p className="text-sm font-semibold text-primary">EcoTrack AI</p>
          <h1 id="welcome-title">Your Personal Sustainability Coach</h1>
          <p className="welcome-description">
            Understand your carbon footprint. Track your environmental impact. Reduce emissions through
            personalized insights and smart sustainability coaching.
          </p>
        </div>

        <EarthIllustration />

        <blockquote className="welcome-quote" key={quote}>
          <span aria-hidden="true">"</span>
          {quote}
          <span aria-hidden="true">"</span>
        </blockquote>

        <button className="welcome-button" type="button" onClick={onGetStarted}>
          Get Started
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </button>

        <p className="welcome-footer">Small actions today create a greener tomorrow.</p>
      </section>
    </main>
  );
}

export function LoadingScreen() {
  return (
    <main className="welcome-shell" aria-busy="true" aria-live="polite">
      <section className="loading-panel" aria-label="Loading EcoTrack AI">
        <div className="loading-mark">
          <Leaf aria-hidden="true" className="h-8 w-8" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Preparing your sustainability workspace</p>
      </section>
    </main>
  );
}

function EarthIllustration() {
  return (
    <div className="earth-scene" aria-label="Animated Earth illustration" role="img">
      <div className="earth-orbit" />
      <div className="earth">
        <span className="earth-land earth-land-one" />
        <span className="earth-land earth-land-two" />
        <span className="earth-land earth-land-three" />
        <span className="earth-line earth-line-one" />
        <span className="earth-line earth-line-two" />
      </div>
      <div className="earth-leaf">
        <Leaf aria-hidden="true" className="h-6 w-6" />
      </div>
    </div>
  );
}
