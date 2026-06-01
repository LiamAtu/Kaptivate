import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommsPage } from './comms.page';

describe('CommsPage', () => {
  let component: CommsPage;
  let fixture: ComponentFixture<CommsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CommsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
