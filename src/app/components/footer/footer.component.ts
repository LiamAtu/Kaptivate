import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE } from '../../site-content';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [RouterLink]
})
export class FooterComponent {
  site = SITE;
  year = new Date().getFullYear();
}
