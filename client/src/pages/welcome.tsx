import { Link } from "wouter";
import toyxLogo from "@assets/Logo-remove-background_1753309864367.png";
import PageContainer from "@/components/ui/PageContainer";
import SectionCard from "@/components/ui/SectionCard";

const FEATURES = [
  {
    title: "Browse Toys",
    desc: "Discover amazing toys shared by families in your community",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "Share Your Toys",
    desc: "List toys your children have outgrown for other families to enjoy",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  {
    title: "Connect & Exchange",
    desc: "Chat with other parents and arrange safe toy exchanges",
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

export default function Welcome() {
  return (
    <PageContainer className="flex flex-col">
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <img src={toyxLogo} alt="ToyX" className="h-20 w-auto mb-6 drop-shadow-md" />

        <p className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">
          Welcome to ToyX!
        </p>

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 text-center mb-10 leading-tight">
          Share toys,<br /> spread joy
        </h1>

        {/* Feature cards */}
        <div className="w-full space-y-4 mb-10">
          {FEATURES.map((f) => (
            <SectionCard key={f.title} className="flex items-center gap-4 p-4">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0">
                {f.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.desc}</p>
              </div>
            </SectionCard>
          ))}
        </div>

        {/* CTA */}
        <Link href="/signup" className="w-full">
          <button className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base font-semibold hover:from-purple-600 hover:to-pink-600 hover:shadow-lg hover:shadow-purple-500/25 transition-all">
            Get Started
          </button>
        </Link>

        <div className="text-center mt-4 pb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">Already have an account? </span>
          <Link href="/login" className="text-sm font-semibold text-purple-500 hover:text-purple-600">
            Log in
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
