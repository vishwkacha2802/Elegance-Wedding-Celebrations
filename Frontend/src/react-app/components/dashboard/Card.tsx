import type { ReactNode } from "react";

type CardProps = {
  title: ReactNode;
  kicker?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function Card({ title, kicker, action, children, className = "" }: CardProps) {
  return (
    <section className={`elegance-card ${className}`}>
      <div className="elegance-card-header">
        <div className="elegance-card-title">
          <span>{title}</span>
          {kicker ? <span className="elegance-kicker">{kicker}</span> : null}
        </div>
        {action || null}
      </div>
      {children}
    </section>
  );
}
