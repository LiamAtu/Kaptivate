import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ILineItem } from '../../models';
import { EuroPipe, sumItems } from '../../shared/format';

/** Editable list of priced lines (used by quotes and invoices). Edits the array it is given. */
@Component({
  selector: 'app-line-items',
  standalone: true,
  imports: [FormsModule, EuroPipe],
  template: `
    <div class="kap-field">
      <label>Items</label>
      @for (item of items; track $index) {
        <div class="line">
          <input class="kap-control" [(ngModel)]="item.description" placeholder="e.g. Half-day filming" />
          <input class="kap-control amount" type="number" min="0" step="0.01" [(ngModel)]="item.amount" placeholder="€" />
          <button type="button" class="kap-btn small danger" (click)="items.splice($index, 1)"
                  [disabled]="items.length === 1" aria-label="Remove line">✕</button>
        </div>
      }
      <div class="kap-row foot">
        <button type="button" class="kap-link" (click)="items.push({ description: '', amount: 0 })">+ Add a line</button>
        <strong>Total {{ total() | euro }}</strong>
      </div>
    </div>
  `,
  styles: [`
    .line { display: grid; grid-template-columns: 1fr 130px auto; gap: 8px; margin-bottom: 8px; }
    .foot { margin-top: 6px; }
    @media (max-width: 600px) { .line { grid-template-columns: 1fr 100px auto; } }
  `]
})
export class LineItemsComponent {
  @Input({ required: true }) items: ILineItem[] = [];
  total() { return sumItems(this.items); }
}
