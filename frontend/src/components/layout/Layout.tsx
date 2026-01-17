import { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  showBackButton?: boolean;
}

export const Layout = ({ children, showBackButton = false }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-white text-gray-dark">
      <Header showBackButton={showBackButton} />
      <main className="flex-grow">{children}</main>
    </div>
  );
};
