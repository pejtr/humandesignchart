import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard page layout wrapping Navbar + content + Footer.
 * Use this instead of manually importing Navbar/Footer in every page.
 */
export default function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-1 ${className ?? ""}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
