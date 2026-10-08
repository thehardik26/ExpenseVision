import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_METADATA = {
  '/dashboard': {
    title: 'Dashboard | ExpenseVision',
    description: 'Track your real-time balance, income, expenses, and AI-powered financial health metrics.',
  },
  '/': {
    title: 'Dashboard | ExpenseVision',
    description: 'Track your real-time balance, income, expenses, and AI-powered financial health metrics.',
  },
  '/budgets': {
    title: 'Monthly Budgets | ExpenseVision',
    description: 'Manage 50/30/20 smart budget allocation, category spending limits, and savings goals.',
  },
  '/reports': {
    title: 'Reports & Analytics | ExpenseVision',
    description: 'Comprehensive 6-month historical trends, expense distribution, and category analytics.',
  },
  '/transactions': {
    title: 'Transactions History | ExpenseVision',
    description: 'Complete record of income and expense transactions in Indian Rupees (₹).',
  },
  '/login': {
    title: 'Sign In | ExpenseVision',
    description: 'Sign in to access your personal ledger, AI financial copilot, and budget trackers.',
  },
};

export default function PageMeta() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname.toLowerCase();
    const currentMeta = PAGE_METADATA[pathname] || {
      title: 'Page Not Found | ExpenseVision',
      description: 'The requested page could not be found on ExpenseVision.',
    };

    document.title = currentMeta.title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = currentMeta.description;

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.content = currentMeta.title;
    }

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.content = currentMeta.description;
    }
  }, [location.pathname]);

  return null;
}
