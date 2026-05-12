"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { BottomSheet } from "./BottomSheet";
import {
  useIncomeClassifications,
  useAddIncomeClassification,
  useAddIncomeCategory,
} from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AddIncomeCategorySheet({ isOpen, onClose }: Props) {
  const [name, setName]                     = useState("");
  const [classification, setClassification] = useState("");
  const [isBudgetable, setIsBudgetable]     = useState(false);
  const [newClass, setNewClass]             = useState("");
  const [addingClass, setAddingClass]       = useState(false);

  const { data: classifications = [], isLoading: loadingClass } = useIncomeClassifications();
  const addClassification = useAddIncomeClassification();
  const addCategory       = useAddIncomeCategory();

  const reset = useCallback(() => {
    setName(""); setClassification(""); setIsBudgetable(false);
    setNewClass(""); setAddingClass(false);
  }, []);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  const handleAddClassification = useCallback(async () => {
    if (!newClass.trim()) return;
    try {
      await addClassification.mutateAsync(newClass.trim());
      setClassification(newClass.trim());
      setNewClass("");
      setAddingClass(false);
      toast.success("Classification added");
    } catch (e) {
      toast.error(String(e));
    }
  }, [newClass, addClassification]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) { toast.error("Enter a category name"); return; }
    if (!classification) { toast.error("Select a classification"); return; }
    try {
      await addCategory.mutateAsync({ name, classification, is_budgetable: isBudgetable });
      toast.success("Category added!");
      reset();
      onClose();
    } catch (e) {
      toast.error(String(e));
    }
  }, [name, classification, isBudgetable, addCategory, reset, onClose]);

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="New Income Category" fullHeight={false}>
      <div className="flex flex-col gap-5 px-5 pt-2 pb-10">

        {/* Name */}
        <div>
          <label className="text-pale text-xs mb-2 block uppercase tracking-wide">Category Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Freelance"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-white placeholder-muted text-sm focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Classification */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-pale text-xs uppercase tracking-wide">Classification</label>
            <button
              onClick={() => setAddingClass((v) => !v)}
              className="flex items-center gap-1 text-brand text-xs font-medium"
            >
              <Plus size={12} /> New
            </button>
          </div>

          <AnimatePresence>
            {addingClass && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 flex gap-2"
              >
                <input
                  type="text"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  placeholder="e.g. Active Income"
                  className="flex-1 bg-surface border border-brand rounded-2xl px-4 py-3 text-white placeholder-muted text-sm focus:outline-none"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddClassification}
                  disabled={addClassification.isPending}
                  className="bg-brand text-white text-sm font-semibold px-4 rounded-2xl disabled:opacity-60"
                >
                  {addClassification.isPending ? <Loader2 size={14} className="animate-spin" /> : "Add"}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingClass ? (
            <div className="h-12 rounded-2xl bg-surface animate-pulse" />
          ) : classifications.length === 0 ? (
            <p className="text-muted text-xs px-1">No classifications yet. Add one above.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classifications.map((c) => (
                <button
                  key={c.income_classification_name}
                  onClick={() => setClassification(c.income_classification_name)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-medium border transition-colors",
                    classification === c.income_classification_name
                      ? "bg-income/20 border-income text-income"
                      : "bg-surface border-border text-pale"
                  )}
                >
                  {c.income_classification_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Budgetable toggle */}
        <div className="flex items-center justify-between bg-surface border border-border rounded-2xl px-4 py-3.5">
          <div>
            <p className="text-white text-sm font-medium">Count toward budgets</p>
            <p className="text-pale text-xs mt-0.5">Include this income in budget calculations</p>
          </div>
          <button
            onClick={() => setIsBudgetable((b) => !b)}
            className={cn(
              "w-12 h-6 rounded-full transition-colors duration-200 relative shrink-0",
              isBudgetable ? "bg-income" : "bg-border"
            )}
          >
            <motion.div
              animate={{ x: isBudgetable ? 24 : 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
            />
          </button>
        </div>

        {/* Submit */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={addCategory.isPending}
          className="w-full bg-income py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-income/30 disabled:opacity-60"
        >
          {addCategory.isPending ? <Loader2 size={18} className="animate-spin" /> : "Add Category"}
        </motion.button>
      </div>
    </BottomSheet>
  );
}
