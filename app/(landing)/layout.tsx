import Navbar from "@/components/common/NavBar";
import Footer from "@/components/common/Footer";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <Navbar />
            {children}
            <Footer />
        </div>
    )
}
