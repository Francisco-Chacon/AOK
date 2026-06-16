import React from "react";
import { cn } from "../utils/cn";

const Card = ({ className = "", children, ...props }) => {
  return (
    <div
      className={cn(
        "flex justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 text-[var(--text-main)] shadow-[var(--record-shadow)] backdrop-blur",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
