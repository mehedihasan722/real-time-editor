import React from "react";

export default function BoardLoadingAnimation({ label = "Preparing your workspace" }: { label?: string }) {
  return <div className="future-loader" role="status" aria-live="polite">
    <div className="future-loader__scene" aria-hidden="true">
      <div className="future-loader__ring" /><div className="future-loader__ring future-loader__ring--two" />
      <div className="future-loader__card future-loader__card--one"><i /><i /></div>
      <div className="future-loader__card future-loader__card--two"><i /><i /></div>
      <div className="future-loader__card future-loader__card--three"><i /><i /></div>
    </div>
    <strong>Flowboard</strong><span>{label}...</span>
    <div className="future-loader__track" aria-hidden="true"><i /></div>
  </div>;
}
