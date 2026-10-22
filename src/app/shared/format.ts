import { Pipe, PipeTransform } from '@angular/core';
import { ILineItem, When } from '../models';

/** Turns a Firestore Timestamp or a Date into a Date (or null). */
export function toDate(value: When | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : value.toDate();
}

export function sumItems(items: ILineItem[]): number {
  return Math.round(items.reduce((total, i) => total + (Number(i.amount) || 0), 0) * 100) / 100;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** `{{ project.dueDate | when }}` → "12 Mar 2027" (use `when:'short'` to include the time). */
@Pipe({ name: 'when', standalone: true })
export class WhenPipe implements PipeTransform {
  transform(value: When | null | undefined, style: 'date' | 'short' = 'date'): string {
    const d = toDate(value);
    if (!d) return '—';
    return style === 'short'
      ? d.toLocaleString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

/** `{{ 1250 | euro }}` → "€1,250.00" */
@Pipe({ name: 'euro', standalone: true })
export class EuroPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value ?? 0);
  }
}

/** `{{ file.fileSize | size }}` → "4.2 MB" */
@Pipe({ name: 'size', standalone: true })
export class SizePipe implements PipeTransform {
  transform(value: number): string { return formatSize(value); }
}
