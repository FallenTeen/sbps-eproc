import React, { useState, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    const returningRef = useRef(false);
    const rafRef = useRef(null);
    const prevBehaviorRef = useRef("");

    const stopAnimation = () => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (returningRef.current) {
            returningRef.current = false;
            document.documentElement.style.scrollBehavior =
                prevBehaviorRef.current;
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            // Selama animasi naik, ring dikontrol oleh animasi, bukan event scroll
            if (returningRef.current) return;

            const scrollTop =
                window.scrollY || document.documentElement.scrollTop;
            const totalScrollable =
                document.documentElement.scrollHeight -
                document.documentElement.clientHeight;

            setScrollProgress(
                totalScrollable > 0
                    ? Math.min((scrollTop / totalScrollable) * 100, 100)
                    : 0,
            );
            setIsVisible(scrollTop > 100);
        };

        const cancelByUser = () => {
            if (returningRef.current) {
                stopAnimation();
                handleScroll();
            }
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll);
        window.addEventListener("wheel", cancelByUser, { passive: true });
        window.addEventListener("touchstart", cancelByUser, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
            window.removeEventListener("wheel", cancelByUser);
            window.removeEventListener("touchstart", cancelByUser);
            stopAnimation();
        };
    }, []);

    const scrollToTop = () => {
        const startY = window.scrollY || document.documentElement.scrollTop;
        if (startY <= 0) return;

        const startProgress = scrollProgress;
        const duration = Math.min(1200, Math.max(600, startY * 0.4));
        const startTime = performance.now();
        const ease = (t) =>
            t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        // Matikan smooth scroll CSS supaya tidak bentrok dengan animasi ini
        const html = document.documentElement;
        prevBehaviorRef.current = html.style.scrollBehavior;
        html.style.scrollBehavior = "auto";
        returningRef.current = true;

        const step = (now) => {
            const t = Math.min((now - startTime) / duration, 1);
            const remaining = 1 - ease(t);

            window.scrollTo(0, startY * remaining);
            setScrollProgress(startProgress * remaining); // ring menyusut bersama scroll

            if (t < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                rafRef.current = null;
                returningRef.current = false;
                html.style.scrollBehavior = prevBehaviorRef.current;
                setScrollProgress(0);
                setIsVisible(false);
            }
        };

        rafRef.current = requestAnimationFrame(step);
    };

    if (!isVisible) return null;

    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset =
        circumference - (scrollProgress / 100) * circumference;

    return (
        <button
            onClick={scrollToTop}
            aria-label="Kembali ke atas"
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center transition-transform duration-200 focus:outline-none"
        >
            {/* Lingkaran latar: putih di light mode, gelap di dark mode */}
            <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#C00000] shadow-lg">
                <svg
                    className="w-full h-full"
                    viewBox="0 0 50 50"
                    style={{ transform: "rotate(-90deg)" }}
                >
                    {/* Track (belum terisi) */}
                    <circle
                        cx="25"
                        cy="25"
                        r={radius}
                        stroke="currentColor"
                        className="text-red-400"
                        strokeWidth="3"
                        fill="transparent"
                    />
                    {/* Progress (terisi) */}
                    <circle
                        cx="25"
                        cy="25"
                        r={radius}
                        stroke="currentColor"
                        className="text-white"
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        opacity={scrollProgress > 0.5 ? 1 : 0}
                    />
                </svg>

                <div className="absolute inset-[7px] rounded-full bg-[#C00000] text-white flex items-center justify-center shadow-md">
                    <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                </div>
            </div>
        </button>
    );
}
