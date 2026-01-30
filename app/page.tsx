'use client';

import { Hero, Features, Demo, Testimonials, WaitingList, FAQ } from "@/components/home";
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
