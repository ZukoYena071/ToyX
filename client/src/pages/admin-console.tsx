import { Link } from "wouter";
import { Shield, Users, Gauge, BarChart3 } from "lucide-react";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";

const ADMIN_SECTIONS = [
  {
    href: "/admin/founding",
    icon: <Users className="w-5 h-5 text-violet-500" />,
    title: "Founding Members",
    desc: "Manage founding member qualifications, approvals, badges and beta access",
    bg: "bg-violet-50 dark:bg-violet-900/20",
  },
  {
    href: "/admin/moderation",
    icon: <Shield className="w-5 h-5 text-red-500" />,
    title: "Moderation",
    desc: "Review user reports, manage bans, suspensions and user communications",
    bg: "bg-red-50 dark:bg-red-900/20",
  },
  {
    href: "/admin/launch-control",
    icon: <Gauge className="w-5 h-5 text-green-500" />,
    title: "Launch Control",
    desc: "Configure platform launch settings, access tiers and promotion",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  {
    href: "/admin/founding-members",
    icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
    title: "Analytics",
    desc: "View founding member signup trends, city breakdowns and export data",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
];

export default function AdminConsole() {
  return (
    <PageContainer>
      <PageHeader title="Admin Console" rightAction={
        <Link href="/profile"><button className="min-w-[44px] min-h-[44px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <svg className="text-gray-600 dark:text-gray-300 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button></Link>
      } />

      <div className="px-4 pt-4 space-y-3">
        {ADMIN_SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <SectionCard className="p-4 cursor-pointer hover:shadow-sm transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${section.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{section.title}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{section.desc}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </SectionCard>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
