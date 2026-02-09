'use client';

import { Hero, Demo, Testimonials, WaitingList } from "@/components/home";
import Future from "@/components/home/Future"

export default function Home() {

    return (
        <>
            <Hero />
            {/* <Features /> */}
            <Future />
            <Demo />
            <Testimonials />
            <WaitingList />
            {/* <FAQ /> */}
        </>
    );
}
