import Navbar from "@/components/landing/common/NavBar";
import Footer from "@/components/landing/common/Footer";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <Navbar />
            {children}
            <Footer />
        </div>
    )
}
