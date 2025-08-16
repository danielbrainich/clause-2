export function Card({ children, className = "" }) {
    return (
      <div className={`flex h-full flex-col rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md
                        dark:border-neutral-800 dark:bg-neutral-900 ${className}`}>
        {children}
      </div>
    );
  }
  export function CardHeader({ children, className = "" }) {
    return (
      <div className={`border-b p-4 dark:border-neutral-800 ${className}`} style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
        {children}
      </div>
    );
  }
  export function CardContent({ children, className = "" }) {
    return <div className={`flex grow flex-col p-4 ${className}`}>{children}</div>;
  }
