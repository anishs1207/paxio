"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    X,
    Users,
    Search,
    Pencil,
    Trash2,
    Plus,
    Check,
} from "lucide-react";
import axios from "axios";

export interface Person {
    id: string;
    name: string;
    email: string;
}

interface PeopleOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const PeopleOverlay: React.FC<PeopleOverlayProps> = ({
    isOpen,
    onClose,
}) => {
    const [people, setPeople] = useState<Person[]>([]);

    const userId = "anushay123";

    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState({ name: "", email: "" });
    const [newPerson, setNewPerson] = useState({ name: "", email: "" });
    const [loading, setLoading] = useState(false);

    const fetchPeople = async () => {
        if (!userId) return;
        setLoading(true);

        try {
            const res = await axios.get<Person[]>("/api/user-list", {
                params: { userId },
            });
            setPeople(res.data);
        } catch (err) {
            console.error("Fetch people failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchPeople();
    }, [isOpen]);


    const addPerson = async () => {
        if (!newPerson.name || !newPerson.email) return;

        try {
            const res = await axios.post<Person>("/api/user-list", {
                ...newPerson,
                userId,
            });

            setPeople((prev) => [res.data, ...prev]);
            setNewPerson({ name: "", email: "" });
        } catch (err) {
            console.error("Add person failed", err);
        }
    };

    /* ----------------------------------
     UPDATE (PUT)
  ----------------------------------- */
    const startEdit = (p: Person) => {
        setEditingId(p.id);
        setEditDraft({ name: p.name, email: p.email });
    };

    const saveEdit = async (id: string) => {
        try {
            const res = await axios.put<Person>("/api/user-list", {
                id,
                ...editDraft,
            });

            setPeople((prev) =>
                prev.map((p) => (p.id === id ? res.data : p))
            );
            setEditingId(null);
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    /* ----------------------------------
        DELETE (DELETE)
     ----------------------------------- */
    const deletePerson = async (id: string) => {
        try {
            await axios.delete("/api/user-list", {
                params: { id },
            });

            setPeople((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const filteredPeople = people.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.email.toLowerCase().includes(search.toLowerCase())
    );


    return (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: isOpen ? 0 : "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none"
        >
            <div className="w-full max-w-2xl bg-zinc-950 border-t border-zinc-800 rounded-t-[2.5rem] px-6 pt-8 pb-10 shadow-2xl pointer-events-auto backdrop-blur-xl bg-opacity-95">
                {/* HEADER */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                            <Users size={15} />
                            People
                        </h2>
                        <p className="text-sm text-zinc-500 mt-1">
                            Manage people and their emails
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ADD PERSON (RESPONSIVE GRID) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <input
                        placeholder="Name"
                        value={newPerson.name}
                        onChange={(e) =>
                            setNewPerson({ ...newPerson, name: e.target.value })
                        }
                        className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                    />
                    <input
                        placeholder="Email"
                        value={newPerson.email}
                        onChange={(e) =>
                            setNewPerson({ ...newPerson, email: e.target.value })
                        }
                        className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                    />

                    {/* Button spans full width on all screens */}
                    <button
                        onClick={addPerson}
                        className="cursor-pointer sm:col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 font-semibold hover:bg-zinc-200"
                    >
                        <Plus size={16} />
                        Add person
                    </button>
                </div>

                {/* SEARCH */}
                <div className="relative mb-6">
                    <Search
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or email"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600"
                    />
                </div>

                {/* LIST */}
                <div className="grid gap-3 max-h-[45vh] overflow-y-auto pr-1">
                    {filteredPeople.map((p) => (
                        <div
                            key={p.id}
                            className="rounded-2xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-all p-4"
                        >
                            {editingId === p.id ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        value={editDraft.name}
                                        onChange={(e) =>
                                            setEditDraft({ ...editDraft, name: e.target.value })
                                        }
                                        className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm"
                                    />
                                    <input
                                        value={editDraft.email}
                                        onChange={(e) =>
                                            setEditDraft({ ...editDraft, email: e.target.value })
                                        }
                                        className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm"
                                    />
                                    <button
                                        onClick={() => saveEdit(p.id)}
                                        className="sm:col-span-2 flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                                    >
                                        <Check size={14} />
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="font-medium text-zinc-200 truncate">
                                            {p.name}
                                        </p>
                                        <p className="text-sm text-zinc-500 truncate">
                                            {p.email}
                                        </p>
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => startEdit(p)}
                                            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => deletePerson(p.id)}
                                            className="p-2 rounded-lg bg-zinc-800 text-red-400 hover:text-red-500"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredPeople.length === 0 && (
                        <p className="text-center text-zinc-500 py-10">
                            No people found
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PeopleOverlay;
