
type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const variants: Record<Variant, string> = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    neutral: 'bg-slate-100 text-slate-600',
};

interface Props {
    children: React.ReactNode;
    variant?: Variant;
    className?: string;
}

export default function Badge({ children, variant = 'neutral', className = '' }: Props) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
    );
}
