import { notFound } from 'next/navigation';
import { getCompanyById, companies } from '@/data/companies';
import { CompanyDetail } from '@/components/CompanyDetail';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return companies.map(c => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const company = getCompanyById(id);
  if (!company) return { title: 'Company Not Found' };
  return {
    title: `${company.ticker} — ${company.name} | HalalFlow`,
    description: `Shariah compliance breakdown for ${company.name}. Status: ${company.screening?.status}.`,
  };
}

export default async function CompanyPage({ params }: Props) {
  const { id } = await params;
  const company = getCompanyById(id);
  if (!company) notFound();

  return <CompanyDetail company={company} />;
}
