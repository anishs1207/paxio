"use client";

import { useState } from "react";
import { AdminDashboard, PasswordGate } from "@/components/admin";

export default function AdminPage() {
    const [unlocked, setUnlocked] = useState(false);

    if (!unlocked) {
        return <PasswordGate onUnlock={() => setUnlocked(true)} />;
    }

    return <AdminDashboard />;
}
