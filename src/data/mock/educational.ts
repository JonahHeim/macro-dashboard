import { EducationalNote } from "@/types/educational";

export const educationalNotes: EducationalNote[] = [
  {
    sectionId: "growth",
    title: "Growth Momentum",
    whyItMatters:
      "Growth momentum drives earnings, default risk, and cyclical asset leadership.",
    howToInterpret:
      "Use multi-indicator trend confirmation; avoid single-print overreaction.",
    pitfall:
      "PMIs and claims are noisy; focus on 3M trend and breadth.",
  },
  {
    sectionId: "inflation",
    title: "Inflation Dynamics",
    whyItMatters:
      "Inflation path drives real rates, policy, and valuation multiples.",
    howToInterpret:
      "Compare headline vs core vs expectations.",
    pitfall:
      "Base effects can distort YoY prints; use MoM annualized context.",
  },
  {
    sectionId: "policy_rates",
    title: "Policy & Rates",
    whyItMatters:
      "Markets react to expected path changes more than level alone.",
    howToInterpret:
      "Combine policy path, real yields, and curve shape.",
    pitfall:
      "Re-steepening is not always bullish; distinguish bull vs bear steepeners.",
  },
  {
    sectionId: "liquidity_credit",
    title: "Liquidity & Credit",
    whyItMatters:
      "Tight liquidity/credit often transmits stress before growth data deteriorates.",
    howToInterpret:
      "Watch spread and funding stress persistence, not one-day spikes.",
    pitfall:
      "Survey data lags; combine with market-based spreads.",
  },
  {
    sectionId: "risk_sentiment",
    title: "Risk Sentiment",
    whyItMatters:
      "Sentiment and volatility affect positioning and short-term regime expression.",
    howToInterpret:
      "Seek confirmation across vol, breadth, and credit.",
    pitfall:
      "Single risk indicators can give false alarms without cross-checks.",
  },
  {
    sectionId: "cross_asset",
    title: "Cross-Asset Signals",
    whyItMatters:
      "Price action validates or challenges macro narrative.",
    howToInterpret:
      "Look for coherent moves across equities, rates, dollar, and commodities.",
    pitfall:
      "Event days can create temporary contradictions; use weekly/monthly confirmation.",
  },
];
