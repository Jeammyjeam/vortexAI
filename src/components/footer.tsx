import Link from "next/link";
import { Github, Twitter } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="flex flex-col sm:flex-row items-center justify-between px-4 md:px-6 py-6 w-full border-t border-white/5 bg-transparent text-muted-foreground z-10">
            <p className="text-xs font-satoshi">&copy; 2024 VORTEX AI GRID. All rights reserved.</p>
            <div className="flex items-center gap-4 sm:gap-6 mt-4 sm:mt-0">
                <Link href="#" className="text-xs hover:text-primary underline-offset-4 font-satoshi" prefetch={false}>
                    Terms of Service
                </Link>
                <Link href="#" className="text-xs hover:text-primary underline-offset-4 font-satoshi" prefetch={false}>
                    Privacy Policy
                </Link>
                <div className="flex gap-3">
                    <Link href="#" aria-label="Github">
                        <Github className="h-4 w-4 hover:text-primary transition-colors" />
                    </Link>
                    <Link href="#" aria-label="Twitter">
                        <Twitter className="h-4 w-4 hover:text-primary transition-colors" />
                    </Link>
                </div>
            </div>
        </footer>
    );
}
