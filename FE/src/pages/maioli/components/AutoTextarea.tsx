import { useRef, useLayoutEffect } from 'react';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

// Textarea che si allarga da sola in base al contenuto (niente maniglia manuale).
export default function AutoTextarea({ value, onInput, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };
  useLayoutEffect(fit, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      rows={2}
      {...rest}
      onInput={(e) => { fit(); onInput?.(e); }}
      className={`maioli-autogrow${rest.className ? ' ' + rest.className : ''}`}
    />
  );
}
